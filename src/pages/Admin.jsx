// src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

function money(n) {
  return `All ${Number(n || 0).toFixed(2)}`;
}

// Upload image(s) to Supabase Storage and return public URL(s)
async function uploadManyProductImages(files) {
  const urls = [];
  for (const file of Array.from(files || [])) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `products/${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }
  return urls;
}

// Normalize product_images (from DB objects or string URLs) to array of URL strings
function normalizeImageUrls(product_images) {
  if (!product_images) return [];
  const arr = Array.isArray(product_images) ? product_images : [];
  return arr
    .map((x) => (typeof x === "string" ? x : x?.image_url))
    .filter(Boolean);
}

// Get URL from either string or object {image_url}
function getUrlFromImg(x) {
  return typeof x === "string" ? x : x?.image_url;
}

export default function Admin() {
  const { user, loadingAuth } = useAuth();
  const nav = useNavigate();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("products"); // products | orders

  // PRODUCTS
  const [products, setProducts] = useState([]);
  const [savingProd, setSavingProd] = useState(false);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: "",
    category: "earrings",
    price: "",
    description: "",
    image_url: "",
    is_available: true, // ✅ NEW
    _fileName: "",
  });

  // ADD PRODUCT images (multi images)
  const [newImages, setNewImages] = useState([]);

  // EDIT MODAL
  const [editing, setEditing] = useState(null); // product object | null
  const [editForm, setEditForm] = useState({
    name: "",
    category: "earrings",
    price: "",
    description: "",
    product_images: [],
    is_available: true, // ✅ NEW
    _fileName: "",
  });
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // ORDERS
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // ----- ADMIN CHECK -----
  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
      nav("/auth");
      return;
    }

    (async () => {
      setChecking(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      const ok = !error && !!data?.is_admin;
      setIsAdmin(ok);
      setChecking(false);

      if (!ok) nav("/");
    })();
  }, [user, loadingAuth, nav]);

  // ----- LOADERS -----
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
          *,
          product_images ( image_url, sort_order )
        `
      )
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setOrders(data || []);
  };

  const loadOrderItems = async (orderId) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!error) setOrderItems(data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadProducts();
    loadOrders();
  }, [isAdmin]);

  // ----- ADD PRODUCT: upload images -----
  const handleNewImagesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingNew(true);
    try {
      const urls = await uploadManyProductImages(fileList);
      setNewImages((prev) => [...prev, ...urls]); // keep adding
      setProdForm((p) => ({ ...p, _fileName: `${urls.length} file(s)` }));
    } catch (e) {
      alert(e.message || "Upload failed");
    } finally {
      setUploadingNew(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();

    const payload = {
      name: prodForm.name.trim(),
      category: prodForm.category || "earrings",
      price: Number(prodForm.price),
      description: prodForm.description?.trim() || "",
      // main image for thumbnail/backwards compatibility
      image_url: (newImages?.[0] || prodForm.image_url || "").trim(),
      is_available: !!prodForm.is_available, // ✅ NEW
    };

    if (!payload.name) return alert("Name is required.");
    if (Number.isNaN(payload.price)) return alert("Price must be a number.");

    // Require at least 1 uploaded image
    if (!newImages || newImages.length === 0) {
      return alert("Please upload at least one image.");
    }

    setSavingProd(true);
    try {
      // 1) Create product and return inserted row
      const { data: created, error: prodErr } = await supabase
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (prodErr) throw prodErr;

      // 2) Insert all product images
      const rows = newImages.map((url, idx) => ({
        product_id: created.id,
        image_url: url,
        sort_order: idx,
      }));

      const { error: imgErr } = await supabase.from("product_images").insert(rows);
      if (imgErr) throw imgErr;

      setProdForm({
        name: "",
        category: "earrings",
        price: "",
        description: "",
        image_url: "",
        is_available: true, // ✅ NEW
        _fileName: "",
      });

      setNewImages([]);
      await loadProducts();
    } catch (err) {
      alert(err.message || "Failed to add product");
    } finally {
      setSavingProd(false);
    }
  };

  // ----- EDIT MODAL -----
  const openEdit = (p) => {
    setEditing(p);
    setEditForm({
      name: p.name ?? "",
      category: p.category ?? "earrings",
      price: String(p.price ?? ""),
      description: p.description ?? "",
      // keep objects from DB or [] if none
      product_images: p.product_images ?? [],
      is_available: p.is_available ?? true, // ✅ NEW
      _fileName: "",
    });
  };

  const closeEdit = () => setEditing(null);

  const uploadEditImage = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setEditUploading(true);
    try {
      const urls = await uploadManyProductImages(fileList);

      // append new urls to existing images
      setEditForm((prev) => ({
        ...prev,
        product_images: [...(prev.product_images || []), ...urls],
      }));
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setEditUploading(false);
    }
  };

  // ✅ Remove an image in edit (UI only until Save)
  const removeEditImage = (removeUrl) => {
    setEditForm((prev) => {
      const next = (prev.product_images || []).filter((img) => {
        const url = getUrlFromImg(img);
        return url && url !== removeUrl;
      });
      return { ...prev, product_images: next };
    });
  };

  const saveEdit = async () => {
    if (!editing) return;

    const urls = normalizeImageUrls(editForm.product_images);

    // optional: require at least one
    if (urls.length === 0) return alert("Please keep at least one image.");

    const payload = {
      name: editForm.name.trim(),
      category: editForm.category || "earrings",
      price: Number(editForm.price),
      description: editForm.description?.trim() || "",
      image_url: urls[0] || "",
      is_available: !!editForm.is_available, // ✅ NEW
    };

    if (!payload.name) return alert("Name is required.");
    if (Number.isNaN(payload.price)) return alert("Price must be a number.");

    setEditSaving(true);
    try {
      // 1) Update product row
      const { error: prodErr } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editing.id);

      if (prodErr) throw prodErr;

      // 2) Replace product_images rows (delete then insert)
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", editing.id);

      if (delErr) throw delErr;

      const rows = urls.map((url, idx) => ({
        product_id: editing.id,
        image_url: url,
        sort_order: idx,
      }));

      const { error: imgErr } = await supabase.from("product_images").insert(rows);
      if (imgErr) throw imgErr;

      await loadProducts();
      closeEdit();
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      // (Optional) delete images first if no FK cascade
      await supabase.from("product_images").delete().eq("product_id", id);

      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      await loadProducts();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  // ----- ORDERS -----
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;

      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((p) => ({ ...p, status }));
      }
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const selectedTotal = useMemo(() => money(selectedOrder?.total ?? 0), [selectedOrder]);

  // ----- UI -----
  if (checking) {
    return (
      <>
        <Header />
        <main className="page adminPage">
          <div className="orderCard">
            <div className="orderTitle">Loading…</div>
            <div className="orderMuted">Checking admin access.</div>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Header />

      <main className="page adminPage">
        <div className="adminCard">
          <div className="adminTop">
            <div>
              <div className="adminTitle">Admin</div>
              <div className="orderMuted">Manage products & orders</div>
            </div>

            <div className="adminTabs">
              <button
                className={`orderBtn ${tab === "products" ? "" : "secondary"}`}
                onClick={() => setTab("products")}
              >
                Products
              </button>
              <button
                className={`orderBtn ${tab === "orders" ? "" : "secondary"}`}
                onClick={() => setTab("orders")}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="orderDivider" />

          {tab === "products" ? (
            <>
              <div className="section-title">Add product</div>

              <form className="adminForm" onSubmit={addProduct}>
                <div>
                  <div className="authLabel">Category</div>
                  <select
                    className="authInput"
                    value={prodForm.category || "earrings"}
                    onChange={(e) => setProdForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="earrings">Earrings</option>
                    <option value="necklaces">Necklaces</option>
                    <option value="rings">Rings</option>
                    <option value="bracelets">Bracelets</option>
                    <option value="sets">Sets</option>
                  </select>
                </div>

                <input
                  className="authInput"
                  placeholder="Name"
                  value={prodForm.name}
                  onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />

                <input
                  className="authInput"
                  placeholder="Price (e.g. 19.99)"
                  value={prodForm.price}
                  onChange={(e) => setProdForm((p) => ({ ...p, price: e.target.value }))}
                  required
                  inputMode="decimal"
                />

                {/* ✅ NEW: Availability */}
                <div>
                  <div className="authLabel">Availability</div>
                  <select
                    className="authInput"
                    value={prodForm.is_available ? "yes" : "no"}
                    onChange={(e) =>
                      setProdForm((p) => ({ ...p, is_available: e.target.value === "yes" }))
                    }
                  >
                    <option value="yes">Available</option>
                    <option value="no">Not available</option>
                  </select>
                </div>

                <textarea
                  className="adminTextarea"
                  placeholder="Description"
                  value={prodForm.description}
                  onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))}
                />

                {/* Upload field */}
                <div className="adminUploadField">
                  <div className="uploadRow">
                    <input
                      id="newProductImage"
                      className="fileHidden"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleNewImagesUpload(e.target.files)}
                      disabled={uploadingNew}
                    />

                    <label className={`uploadBtn ${uploadingNew ? "disabled" : ""}`} htmlFor="newProductImage">
                      {uploadingNew ? "Uploading…" : "Choose image"}
                    </label>

                    <div className="uploadName">
                      {newImages?.length ? `${newImages.length} image(s) selected ✅` : "No file selected"}
                    </div>
                  </div>

                  <div className="orderMutedSmall">
                    {newImages?.length ? "Uploaded ✅ Ready to save." : "Upload JPG/PNG images."}
                  </div>

                  <div className="adminPreviewDirection">
                    {newImages?.map((url) => (
                      <div className="adminPreview" key={url}>
                        <img src={url} alt="" />
                      </div>
                    ))}
                  </div>
                </div>

                <button className="authBtn" disabled={savingProd || uploadingNew}>
                  {savingProd ? "Saving…" : "Add product"}
                </button>
              </form>

              <div className="orderDivider" />

              <div className="section-title">All products</div>

              <div className="adminList">
                {products.map((p) => (
                  <div className="adminRow" key={p.id}>
                    <img className="adminThumb" src={p.image_url} alt="" />

                    <div className="adminRowMain">
                      <div className="adminRowName">
                        {p.name}{" "}
                        <span style={{ fontSize: 12, marginLeft: 8 }}>
                          {p.is_available ? "✅ Available" : "⛔ Not available"}
                        </span>
                      </div>

                      <div className="orderMutedSmall">{money(p.price)}</div>

                      <div className="adminRowActions">
                        <button className="adminActionBtn" onClick={() => openEdit(p)}>
                          Edit
                        </button>

                        <button className="adminActionBtn" onClick={() => deleteProduct(p.id)}>
                          Delete
                        </button>

                        <Link className="adminActionBtn" to={`/product/${p.id}`}>
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="section-title">All orders</div>

              <div className="adminOrdersGrid">
                <div className="adminOrdersList">
                  {orders.map((o) => (
                    <button
                      key={o.id}
                      className={`adminOrderItem ${selectedOrder?.id === o.id ? "active" : ""}`}
                      onClick={async () => {
                        setSelectedOrder(o);
                        await loadOrderItems(o.id);
                      }}
                    >
                      <div className="accountOrderId">{o.id}</div>
                      <div className="orderMutedSmall">
                        {new Date(o.created_at).toLocaleString()} · {money(o.total)} · <strong>{o.status}</strong>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="adminOrderDetail">
                  {!selectedOrder ? (
                    <div className="orderMuted">Select an order to view details.</div>
                  ) : (
                    <>
                      <div className="adminDetailTop">
                        <div>
                          <div className="adminRowName">Order</div>
                          <div className="accountOrderId">{selectedOrder.id}</div>
                        </div>

                        <select
                          className="adminSelect"
                          value={selectedOrder.status}
                          onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                        >
                          <option value="pending">pending</option>
                          <option value="paid">paid</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </div>

                      <div className="orderDivider" />

                      {orderItems.map((it) => (
                        <div className="orderRow" key={it.id}>
                          <div className="orderRowLeft">
                            <div className="orderName">{it.name}</div>
                            <div className="orderMutedSmall">
                              Qty {it.quantity} · {money(it.price)}
                            </div>
                          </div>
                          <div className="orderRowRight">{money(Number(it.price) * Number(it.quantity))}</div>
                        </div>
                      ))}

                      <div className="orderDivider" />
                      <div className="orderTotal">
                        <span>Total</span>
                        <span>{selectedTotal}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* EDIT MODAL */}
        {editing && (
          <div className="modalOverlay" onMouseDown={closeEdit}>
            <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modalTop">
                <div>
                  <div className="section-title">Edit product</div>
                  <div className="orderMutedSmall">{editing.name}</div>
                </div>

                <button className="modalActionBtn" onClick={closeEdit}>
                  Close
                </button>
              </div>

              <div className="orderDivider" />

              <div className="adminForm">
                <div className="adminRow2">
                  <div>
                    <div className="authLabel">Category</div>
                    <select
                      className="authInput"
                      value={editForm.category}
                      onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="earrings">Earrings</option>
                      <option value="necklaces">Necklaces</option>
                      <option value="rings">Rings</option>
                      <option value="bracelets">Bracelets</option>
                      <option value="sets">Sets</option>
                    </select>
                  </div>

                  <div>
                    <div className="authLabel">Name</div>
                    <input
                      className="authInput"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="authLabel">Price</div>
                    <input
                      className="authInput"
                      value={editForm.price}
                      onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                      inputMode="decimal"
                    />
                  </div>

                  {/* ✅ NEW: Availability */}
                  <div>
                    <div className="authLabel">Availability</div>
                    <select
                      className="authInput"
                      value={editForm.is_available ? "yes" : "no"}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, is_available: e.target.value === "yes" }))
                      }
                    >
                      <option value="yes">Available</option>
                      <option value="no">Not available</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="authLabel">Description</div>
                  <textarea
                    className="adminTextarea"
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* ✅ Images + remove */}
                <div>
                  <div className="authLabel">Images</div>

                  <div className="editMediaRow">
                    <div className="editCoverImage">
                      {normalizeImageUrls(editForm.product_images).length ? (
                        normalizeImageUrls(editForm.product_images).map((url) => (
                          <div className="editPreviewCard" key={url} style={{ position: "relative" }}>
                            <img src={url} alt="" />

                            <button
                              type="button"
                              className="removeImgBtn"
                              onClick={() => removeEditImage(url)}
                              aria-label="Remove image"
                              title="Remove image"
                              style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                padding: "2px 6px",
                                borderRadius: 10,
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="orderMutedSmall">No image</div>
                      )}
                    </div>

                    <div className="adminUploadField">
                      <input
                        id="editProductImage"
                        className="fileHidden"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          const first = files?.[0];
                          if (first) {
                            setEditForm((p) => ({ ...p, _fileName: first.name }));
                            uploadEditImage(files);
                          }
                        }}
                        disabled={editUploading}
                      />

                      <div className="uploadRow">
                        <label className={`uploadBtn ${editUploading ? "disabled" : ""}`} htmlFor="editProductImage">
                          {editUploading ? "Uploading…" : "Choose image"}
                        </label>

                        <div className="uploadName">
                          {editForm._fileName
                            ? editForm._fileName
                            : editUploading
                            ? "Uploading…"
                            : "No file selected"}
                        </div>
                      </div>

                      <div className="orderMutedSmall">
                        {editUploading
                          ? "Uploading to storage…"
                          : "Upload new images (they will be saved when you click Save)."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="orderDivider" />

              <div className="modalActions">
                <button
                  className="modalActionBtn"
                  onClick={saveEdit}
                  disabled={editSaving || editUploading}
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>

                <button className="modalActionBtn" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}