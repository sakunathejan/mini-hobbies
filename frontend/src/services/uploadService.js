import api from "./api.js";

export const uploadProductImages = (files) => {
  const formData = new FormData();
  [...files].forEach((file) => formData.append("images", file));
  return api
    .post("/uploads/products", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then((res) => res.data.images);
};
