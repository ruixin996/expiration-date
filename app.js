const STORAGE_KEY = "expiration_manager_items_v1";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error("load error", e);
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatDateToInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeExpiryDate(productionDateStr, shelfValue, shelfUnit) {
  if (!productionDateStr || !shelfValue || shelfValue <= 0) return "";
  const d = new Date(productionDateStr);
  if (Number.isNaN(d.getTime())) return "";

  if (shelfUnit === "day") {
    d.setDate(d.getDate() + shelfValue);
  } else if (shelfUnit === "month") {
    d.setMonth(d.getMonth() + shelfValue);
  } else if (shelfUnit === "year") {
    d.setFullYear(d.getFullYear() + shelfValue);
  }

  return formatDateToInput(d);
}

function calcStatus(expiryDateStr, noticeDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry - today;
  const diffDays = Math.round(diffMs / 86400000);

  let status = "safe";
  if (diffDays < 0) status = "expired";
  else if (diffDays <= noticeDays) status = "warning";

  return { daysLeft: diffDays, status };
}

function renderTable(items) {
  const tbody = document.getElementById("items-tbody");
  const emptyTip = document.getElementById("empty-tip");
  tbody.innerHTML = "";

  if (!items.length) {
    emptyTip.classList.remove("hidden");
    return;
  }
  emptyTip.classList.add("hidden");

  for (const item of items) {
    const { daysLeft, status } = calcStatus(item.expiryDate, Number(item.noticeDays || 0));

    const tr = document.createElement("tr");
    tr.dataset.id = item.id;

    const tdSku = document.createElement("td");
    tdSku.textContent = item.sku || "-";

    const tdName = document.createElement("td");
    tdName.textContent = item.name;

    const tdCategory = document.createElement("td");
    tdCategory.textContent = item.category || "-";

    const tdProd = document.createElement("td");
    tdProd.textContent = item.productionDate || "-";

    const tdExpiry = document.createElement("td");
    tdExpiry.textContent = item.expiryDate;

    const tdDays = document.createElement("td");
    const spanDays = document.createElement("span");
    spanDays.className = `days-left ${status}`;
    spanDays.textContent = daysLeft >= 0 ? `${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`;
    tdDays.appendChild(spanDays);

    const tdStatus = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `status-pill ${status}`;
    pill.textContent = status === "safe" ? "正常" : status === "warning" ? "即将过期" : "已过期";
    tdStatus.appendChild(pill);

    const tdActions = document.createElement("td");
    tdActions.className = "actions-cell";
    const editLink = document.createElement("span");
    editLink.className = "action-link";
    editLink.textContent = "编辑";
    editLink.addEventListener("click", () => fillFormForEdit(item.id));
    const delLink = document.createElement("span");
    delLink.className = "action-link";
    delLink.textContent = "删除";
    delLink.addEventListener("click", () => deleteItem(item.id));
    tdActions.append(editLink, delLink);

    tr.append(tdSku, tdName, tdCategory, tdProd, tdExpiry, tdDays, tdStatus, tdActions);
    tbody.appendChild(tr);
  }
}

function getFormValues() {
  const idInput = document.getElementById("item-id");
  const skuInput = document.getElementById("sku");
  const nameInput = document.getElementById("name");
  const categoryInput = document.getElementById("category");
  const productionInput = document.getElementById("productionDate");
  const noticeInput = document.getElementById("noticeDays");
  const shelfValueInput = document.getElementById("shelfValue");
  const shelfUnitInput = document.getElementById("shelfUnit");

  const productionDate = productionInput.value;
  const shelfValue = Number(shelfValueInput.value || 0);
  const shelfUnit = shelfUnitInput.value || "day";

  const expiryDate = computeExpiryDate(productionDate, shelfValue, shelfUnit);

  return {
    id: idInput.value || String(Date.now()),
    sku: skuInput.value.trim(),
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    productionDate,
    expiryDate,
    shelfValue: Number.isNaN(shelfValue) ? 0 : shelfValue,
    shelfUnit,
    noticeDays: Number(noticeInput.value || 0),
    createdAt: idInput.value ? undefined : new Date().toISOString(),
  };
}

function resetForm() {
  document.getElementById("item-id").value = "";
  document.getElementById("item-form").reset();
  document.getElementById("noticeDays").value = 3;
  const shelfUnitInput = document.getElementById("shelfUnit");
  if (shelfUnitInput) shelfUnitInput.value = "day";
}

function fillFormForEdit(id) {
  const items = loadItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  document.getElementById("item-id").value = item.id;
  const skuInput = document.getElementById("sku");
  if (skuInput) skuInput.value = item.sku || "";
  document.getElementById("name").value = item.name;
  document.getElementById("category").value = item.category || "";
  document.getElementById("productionDate").value = item.productionDate || "";
  const shelfValueInput = document.getElementById("shelfValue");
  const shelfUnitInput = document.getElementById("shelfUnit");
  if (shelfValueInput) shelfValueInput.value = item.shelfValue ?? "";
  if (shelfUnitInput) shelfUnitInput.value = item.shelfUnit || "day";
  document.getElementById("noticeDays").value = item.noticeDays ?? 3;
}

function deleteItem(id) {
  if (!confirm("确定要删除该物品吗？")) return;
  const items = loadItems();
  const next = items.filter((i) => i.id !== id);
  saveItems(next);
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;
  const sortBy = document.getElementById("sort-by").value;

  const items = loadItems();
  let filtered = items.map((i) => {
    const { daysLeft, status } = calcStatus(i.expiryDate, Number(i.noticeDays || 0));
    return { ...i, _daysLeft: daysLeft, _status: status };
  });

  if (search) {
    filtered = filtered.filter(
      (i) =>
        (i.sku || "").toLowerCase().includes(search) ||
        (i.name || "").toLowerCase().includes(search) ||
        (i.category || "").toLowerCase().includes(search)
    );
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter((i) => i._status === statusFilter);
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "expiryDateAsc":
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      case "expiryDateDesc":
        return new Date(b.expiryDate) - new Date(a.expiryDate);
      case "daysLeftAsc":
        return a._daysLeft - b._daysLeft;
      case "daysLeftDesc":
        return b._daysLeft - a._daysLeft;
      default:
        return 0;
    }
  });

  renderTable(filtered);
}

function exportData() {
  const items = loadItems();
  const blob = new Blob([JSON.stringify(items, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expiration-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) {
        alert("导入失败：文件格式不正确（需要数组）。");
        return;
      }
      saveItems(parsed);
      applyFiltersAndRender();
      alert("导入成功。");
    } catch (err) {
      console.error(err);
      alert("导入失败：无法解析 JSON。");
    }
  };
  reader.readAsText(file, "utf-8");
}

function clearAll() {
  if (!confirm("确定要清空所有数据吗？此操作不可恢复。")) return;
  localStorage.removeItem(STORAGE_KEY);
  applyFiltersAndRender();
}

let quaggaRunning = false;

function onQuaggaDetected(result) {
  const skuInput = document.getElementById("sku");
  if (!result || !result.codeResult || !result.codeResult.code) return;
  const code = result.codeResult.code;
  if (skuInput) {
    skuInput.value = code;
  }
  closeScanDialog();
}

function openScanDialog() {
  const dialog = document.getElementById("scan-dialog");
  if (!dialog) return;
  dialog.classList.remove("hidden");

  const target = document.getElementById("qr-reader");

  if (!window.Quagga) {
    alert("扫码库加载失败，请检查网络后重试。");
    return;
  }

  // 每次重新初始化，避免旧状态残留
  if (quaggaRunning) {
    try {
      Quagga.stop();
      Quagga.offDetected(onQuaggaDetected);
    } catch (e) {
      console.error(e);
    }
    quaggaRunning = false;
  }

  const config = {
    inputStream: {
      type: "LiveStream",
      target,
      constraints: {
        facingMode: "environment",
      },
    },
    decoder: {
      readers: ["ean_reader", "ean_13_reader", "code_128_reader", "upc_reader"],
    },
    locator: {
      patchSize: "medium",
      halfSample: true,
    },
    locate: true,
  };

  Quagga.init(config, (err) => {
    if (err) {
      console.error(err);
      // 某些环境下即使返回 err 也能正常打开摄像头，这里不再弹出提示，仅记录日志
      // 如果确实无法启动，后续 Quagga.start 会抛错，在控制台可见
    }
    Quagga.onDetected(onQuaggaDetected);
    Quagga.start();
    quaggaRunning = true;
  });
}

function closeScanDialog() {
  const dialog = document.getElementById("scan-dialog");
  if (dialog) dialog.classList.add("hidden");
  if (window.Quagga && quaggaRunning) {
    try {
      Quagga.stop();
      Quagga.offDetected(onQuaggaDetected);
    } catch (e) {
      console.error(e);
    }
    quaggaRunning = false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("item-form");
  const resetBtn = document.getElementById("reset-btn");
  const searchInput = document.getElementById("search");
  const statusFilter = document.getElementById("status-filter");
  const sortBy = document.getElementById("sort-by");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-input");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const scanSkuBtn = document.getElementById("scan-sku-btn");
  const scanCloseBtn = document.getElementById("scan-close-btn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = getFormValues();
    if (!values.name) {
      alert("请填写名称。");
      return;
    }
    if (!values.productionDate) {
      alert("请选择生产日期。");
      return;
    }
    if (!values.shelfValue || values.shelfValue <= 0) {
      alert("请填写大于 0 的保质期时长。");
      return;
    }
    if (!values.expiryDate) {
      alert("无法根据生产日期和保质期时长计算到期日期，请检查输入。");
      return;
    }

    const items = loadItems();

    // 当 SKU 相同且生产日期也相同时，不允许重复
    if (values.sku) {
      const sameSkuSameProd = items.find(
        (i) =>
          i.id !== values.id &&
          i.sku &&
          i.sku === values.sku &&
          i.productionDate === values.productionDate
      );
      if (sameSkuSameProd) {
        alert("同一个 SKU 下，不能有相同的生产日期记录。");
        return;
      }
    }
    const index = items.findIndex((i) => i.id === values.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...values };
    } else {
      items.push(values);
    }

    saveItems(items);
    resetForm();
    applyFiltersAndRender();
  });

  resetBtn.addEventListener("click", () => resetForm());
  searchInput.addEventListener("input", () => applyFiltersAndRender());
  statusFilter.addEventListener("change", () => applyFiltersAndRender());
  sortBy.addEventListener("change", () => applyFiltersAndRender());
  exportBtn.addEventListener("click", () => exportData());
  importInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
      importInput.value = "";
    }
  });
  clearAllBtn.addEventListener("click", () => clearAll());

  if (scanSkuBtn) {
    scanSkuBtn.addEventListener("click", () => openScanDialog());
  }
  if (scanCloseBtn) {
    scanCloseBtn.addEventListener("click", () => closeScanDialog());
  }

  applyFiltersAndRender();
});

