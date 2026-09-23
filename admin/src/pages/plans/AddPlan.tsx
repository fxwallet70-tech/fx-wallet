import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import { createPlan } from "../../services/planService";
import {
  formatPlanDuration,
  validatePlanDurationInput,
} from "../../utils/duration";

export default function AddPlan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    image: "",
    price: 0,
    duration: 30,
    durationHours: 0,
    durationMinutes: 0,
    returnAmount: 0,
    displayOrder: 1,
    status: true,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" ||
        name === "duration" ||
        name === "durationHours" ||
        name === "durationMinutes" ||
        name === "returnAmount" ||
        name === "displayOrder"
          ? Number(value)
          : name === "status"
          ? value === "true"
          : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }

    if (form.price < 0) {
      alert("Price cannot be negative");
      return;
    }

    const durationError = validatePlanDurationInput(form);

    if (durationError) {
      alert(durationError);
      return;
    }

    if (form.returnAmount < 0) {
      alert("Return amount cannot be negative");
      return;
    }

    try {
      setSaving(true);

      await createPlan({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        image: form.image.trim(),
        price: Number(form.price),
        duration: Number(form.duration),
        durationHours: Number(form.durationHours),
        durationMinutes: Number(form.durationMinutes),
        returnAmount: Number(form.returnAmount),
        displayOrder: Number(form.displayOrder),
      });

      alert("Plan Created Successfully");
      navigate("/plans");
    } catch (error: any) {
      console.error("Create Plan Error:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to create plan"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="plan-form-page">
        <div className="plan-form-header">
          <div>
            <h1>Add New Plan</h1>
            <p>Create a new plan for mobile users.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/plans")}
          >
            Back
          </button>
        </div>

        <div className="plan-form-card">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Title</label>
              <input
                name="title"
                placeholder="Enter plan title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Enter plan description"
                rows={4}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                name="category"
                placeholder="General"
                value={form.category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                name="image"
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                min="0"
                name="price"
                placeholder="299"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Duration</label>

              <div className="duration-fields">
                <div className="form-group">
                  <label>Days</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="duration"
                    placeholder="30"
                    value={form.duration}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Hours (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    step="1"
                    name="durationHours"
                    placeholder="0"
                    value={form.durationHours}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Minutes (0-59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    name="durationMinutes"
                    placeholder="0"
                    value={form.durationMinutes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <span className="duration-hint">
                Plan runs for {formatPlanDuration(form)}. Use hours and minutes
                for plans shorter than a day, e.g. 0 days, 2 hours, 30 minutes.
              </span>
            </div>

            <div className="form-group">
              <label>Return Amount</label>
              <input
                type="number"
                min="0"
                name="returnAmount"
                placeholder="350"
                value={form.returnAmount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Display Order</label>
              <input
                type="number"
                min="0"
                name="displayOrder"
                placeholder="1"
                value={form.displayOrder}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={String(form.status)}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/plans")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}