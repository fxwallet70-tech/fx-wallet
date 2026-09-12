const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Access tokens are deliberately short lived because every API call carries one.
 * They are renewed silently with a refresh token, which is what keeps an
 * actively used session alive without sending the user back to the login screen.
 */
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';

/**
 * How long a session can be renewed before the user has to log in again.
 * JWT_EXPIRES_IN is still honoured as a fallback so a deployment that already
 * configured it keeps the session length it expects.
 */
const REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '365d';

/** Refresh tokens may be signed with their own secret; JWT_SECRET is the fallback. */
const refreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

/** Caps the per-account session list so it cannot grow without bound. */
const MAX_SESSIONS = 10;

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

/**
 * Refresh tokens carry a random `jti`. Without it two tokens issued in the same
 * second for the same account would be byte-identical, and a rotation would not
 * actually replace the token it was meant to invalidate.
 */
const signRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    refreshSecret(),
    {
      expiresIn: REFRESH_EXPIRES_IN,
    }
  );

/**
 * Verifies a refresh token. An access token passed in here is rejected, so it
 * can never be traded up for a longer session.
 */
const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, refreshSecret());

  if (decoded?.type !== 'refresh') {
    throw new Error('Not a refresh token');
  }

  return decoded;
};

/**
 * Refresh tokens are stored as a SHA-256 digest, never as plain text, so a
 * database dump cannot be replayed as a live session.
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

/** Reads the expiry baked into the token, so storage and JWT never disagree. */
const expiresAtOf = (token) => new Date(jwt.decode(token).exp * 1000);

/** Finds the stored session matching a refresh token, or undefined. */
const findSession = (doc, token) =>
  (doc.refreshSessions || []).find(
    (session) => session.tokenHash === hashToken(token),
  );

/**
 * Signs a fresh access + refresh token pair and records the refresh token
 * against the account.
 *
 * The session list is written with update operators rather than a document
 * save: `refreshSessions` is not selected on an ordinary lookup, so saving the
 * whole document would write back an empty array and silently log out every
 * other device the account is signed in on.
 *
 * @param {object} doc account document to store the session on
 * @param {object} payload claims placed in the access token
 * @param {string} [replaceHash] digest of the refresh token being rotated away
 * @returns {Promise<{token: string, refreshToken: string}>}
 */
const issueTokens = async (doc, payload, replaceHash) => {
  const token = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Expired sessions, plus the token being rotated away, are pulled out before
  // the new session is pushed in.
  const staleSessions = [{ expiresAt: { $lte: new Date() } }];

  if (replaceHash) {
    staleSessions.push({ tokenHash: replaceHash });
  }

  // MongoDB refuses a $pull and a $push on the same field in one update
  // document, so the removal and the addition are two atomic writes.
  await doc.updateOne({
    $pull: { refreshSessions: { $or: staleSessions } },
  });

  await doc.updateOne({
    $push: {
      refreshSessions: {
        $each: [
          {
            tokenHash: hashToken(refreshToken),
            expiresAt: expiresAtOf(refreshToken),
          },
        ],
        $slice: -MAX_SESSIONS,
      },
    },
  });

  return { token, refreshToken };
};

/** Revokes a single session (logout on one device). */
const revokeSession = async (doc, token) => {
  await doc.updateOne({
    $pull: { refreshSessions: { tokenHash: hashToken(token) } },
  });
};

/** Revokes every session on an account (used when a refresh token is replayed). */
const clearSessions = async (doc) => {
  await doc.updateOne({ $set: { refreshSessions: [] } });
};

module.exports = {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  hashToken,
  verifyRefreshToken,
  findSession,
  issueTokens,
  revokeSession,
  clearSessions,
};
