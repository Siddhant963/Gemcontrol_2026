// Pure validation for the Item / Stock add + edit forms. These are the same
// rules the forms used inline (and mirror Backend Addstock/updateStock) --
// moved here so add, edit, on-blur and live revalidation share ONE
// definition. No business rule is changed.

export const STOCK_FORM_FIELDS = [
  "name",
  "materialgitType",
  "waight",
  "karat",
  "lessWeight",
  "category",
  "firm",
  "quantity",
  "price",
  "makingCharge",
  "labourChargeValue",
  "stoneCharge",
];

const isBlank = (v) => v === "" || v === undefined;

export function getStockFormErrors(item) {
  const errors = {};
  if (!item.name.trim()) errors.name = "Item name is required";
  else if (!/[A-Za-z]/.test(item.name))
    errors.name = "Item name must contain letters, not just numbers";
  if (!item.materialgitType) errors.materialgitType = "Material type is required";
  if (!item.waight || isNaN(item.waight) || item.waight <= 0)
    errors.waight = "Valid weight is required";
  if ((item.materialgitType === "gold" || item.materialgitType === "diamond") && !item.karat)
    errors.karat = "Karat is required for gold and diamond items";
  if (!isBlank(item.lessWeight)) {
    if (isNaN(item.lessWeight) || Number(item.lessWeight) < 0)
      errors.lessWeight = "Less weight cannot be negative";
    else if (Number(item.lessWeight) > (Number(item.waight) || 0))
      errors.lessWeight = "Less weight cannot exceed gross weight";
  }
  if (!item.category) errors.category = "Category is required";
  if (!item.firm) errors.firm = "Firm is required";
  if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0)
    errors.quantity = "Valid quantity is required";
  if (!item.price || isNaN(item.price) || item.price <= 0)
    errors.price = "Valid price is required";
  if (!item.makingCharge || isNaN(item.makingCharge) || item.makingCharge < 0)
    errors.makingCharge = "Valid making charge is required";
  if (!isBlank(item.labourChargeValue)) {
    if (isNaN(item.labourChargeValue) || Number(item.labourChargeValue) < 0)
      errors.labourChargeValue = "Labour/Polishing charge cannot be negative";
  }
  if (!isBlank(item.stoneCharge)) {
    if (isNaN(item.stoneCharge) || Number(item.stoneCharge) < 0)
      errors.stoneCharge = "Stone charge cannot be negative";
  }
  return errors;
}

// Backend (Addstock / updateStock) replies { message } only.
export const STOCK_SERVER_ERROR_RULES = [
  [/item name is required|name must contain letters|already exists/i, "name"],
  [/material type is required/i, "materialgitType"],
  [/category is required/i, "category"],
  [/quantity must be/i, "quantity"],
  [/weight must be greater|gross weight must exceed/i, "waight"],
  [/less weight/i, "lessWeight"],
  [/price must be/i, "price"],
  [/labour/i, "labourChargeValue"],
  [/stone charge/i, "stoneCharge"],
  [/karat is required/i, "karat"],
];
