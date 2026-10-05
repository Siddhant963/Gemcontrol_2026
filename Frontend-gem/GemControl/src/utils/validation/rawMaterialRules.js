// Pure validation for the Raw Material forms -- the same rules the page had
// inline (mirroring Backend createRawMaterial / AddRawMaterialStock).

export const RAW_MATERIAL_FORM_FIELDS = ["name", "materialType", "quantity", "weight", "price", "firm"];
export const RAW_STOCK_FORM_FIELDS = ["rawMaterialId", "quantity"];

export function getRawMaterialErrors(material) {
  const errors = {};
  if (!material.name.trim()) errors.name = "Material name is required";
  else if (!/[A-Za-z]/.test(material.name))
    errors.name = "Name must contain letters, not just numbers";
  if (!material.materialType) errors.materialType = "Material type is required";
  if (!material.quantity || isNaN(material.quantity) || material.quantity <= 0)
    errors.quantity = "Valid quantity is required";
  if (material.weight !== "" && (isNaN(material.weight) || Number(material.weight) < 0))
    errors.weight = "Weight cannot be negative";
  if (material.price !== "" && (isNaN(material.price) || Number(material.price) < 0))
    errors.price = "Price cannot be negative";
  if (!material.firm) errors.firm = "Firm is required";
  return errors;
}

export function getRawStockErrors(update) {
  const errors = {};
  if (!update.rawMaterialId) errors.rawMaterialId = "Material selection is required";
  if (!update.quantity || isNaN(update.quantity) || update.quantity <= 0)
    errors.quantity = "Valid quantity is required";
  return errors;
}

export const RAW_MATERIAL_SERVER_ERROR_RULES = [
  [/name must contain letters|already exists|name is required/i, "name"],
  [/all fields are required/i, null],
  [/weight cannot be negative/i, "weight"],
  [/price cannot be negative/i, "price"],
];

export const RAW_STOCK_SERVER_ERROR_RULES = [[/quantity/i, "quantity"]];
