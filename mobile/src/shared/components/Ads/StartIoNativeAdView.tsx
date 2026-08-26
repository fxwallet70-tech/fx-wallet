import React, {useEffect} from 'react';
import {requireNativeComponent, type ViewProps} from 'react-native';

export interface StartIoNativeAdViewProps extends ViewProps {
  onShown?: () => void;
}

/**
 * Start.io native ad view (Android only). Rendered natively so the
 * SDK can register the view for click/impression tracking.
 */
const NativeStartIoAdView = requireNativeComponent<StartIoNativeAdViewProps>(
  'StartIoNativeAdView',
);

const StartIoNativeAdView = ({onShown, ...props}: StartIoNativeAdViewProps) => {
  useEffect(() => {
    onShown?.();
    // Track once when the view mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <NativeStartIoAdView {...props} />;
};

export default StartIoNativeAdView;
