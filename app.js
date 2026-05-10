const firebaseConfig = {
  databaseURL: "https://continental-f76a8-default-rtdb.firebaseio.com",
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const defaultImage = "https://via.placeholder.com/600x400?text=Continental";
const maxImageWidth = 1200;
const imageQuality = 0.72;

let finalImageData = "";
let editingNewsId = null;
let editingOriginalImage = "";

const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const uploadArea = document.getElementById("uploadArea");
const uploadText = document.getElementById("uploadText");
const removeImgBtn = document.getElementById("removeImgBtn");
const publishBtn = document.getElementById("publishBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const newsTitle = document.getElementById("newsTitle");
const newsContent = document.getElementById("newsContent");
const newsType = document.getElementById("newsType");
const newsList = document.getElementById("newsList");
const statusBox = document.getElementById("status");
const livePreviewImage = document.getElementById("livePreviewImage");
const livePreviewType = document.getElementById("livePreviewType");
const livePreviewTitle = document.getElementById("livePreviewTitle");
const livePreviewContent = document.getElementById("livePreviewContent");

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        const scale = Math.min(1, maxImageWidth / image.width);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", imageQuality));
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  showStatus("جاري ضغط الصورة...", "var(--primary)");

  try {
    finalImageData = await compressImage(file);
    imagePreview.src = finalImageData;
    imagePreview.style.display = "block";
    uploadText.style.display = "none";
    removeImgBtn.style.display = "block";
    updateLivePreview();
    showStatus("تم ضغط الصورة وتجهيزها.", "var(--success)");
  } catch (error) {
    showStatus("تعذر ضغط الصورة، اختر صورة أخرى.", "var(--danger)");
  }
}

function clearImage() {
  finalImageData = "";
  editingOriginalImage = "";
  fileInput.value = "";
  imagePreview.style.display = "none";
  uploadText.style.display = "block";
  removeImgBtn.style.display = "none";
  updateLivePreview();
}

function getActiveImage() {
  return finalImageData || editingOriginalImage || defaultImage;
}

function updateLivePreview() {
  livePreviewTitle.textContent = newsTitle.value.trim() || "عنوان الخبر سيظهر هنا";
  livePreviewContent.textContent =
    newsContent.value.trim() || "تفاصيل الخبر ستظهر هنا أثناء الكتابة.";
  livePreviewType.textContent = newsType.value;
  livePreviewImage.src = getActiveImage();
}

function resetForm() {
  editingNewsId = null;
  editingOriginalImage = "";
  newsTitle.value = "";
  newsContent.value = "";
  newsType.value = "Company News";
  clearImage();
  formTitle.innerHTML = '<i class="fas fa-edit"></i> إضافة خبر جديد';
  publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> نشر الآن';
  cancelEditBtn.style.display = "none";
  updateLivePreview();
}

function getNewsPayload() {
  return {
    title: newsTitle.value.trim(),
    content: newsContent.value.trim(),
    type: newsType.value,
    img: getActiveImage(),
    date: new Date().toLocaleDateString("en-GB"),
    timestamp: Date.now(),
  };
}

async function saveNews() {
  const payload = getNewsPayload();

  if (!payload.title || !payload.content) {
    alert("يرجى إدخال العنوان والمحتوى!");
    return;
  }

  publishBtn.disabled = true;
  showStatus(editingNewsId ? "جاري حفظ التعديل..." : "جاري النشر...", "var(--primary)");

  try {
    if (editingNewsId) {
      await database.ref("news").child(editingNewsId).update(payload);
      showStatus("تم حفظ التعديل.", "var(--success)");
    } else {
      await database.ref("news").push(payload);
      showStatus("تم النشر.", "var(--success)");
    }

    resetForm();
  } catch (error) {
    showStatus("تعذر حفظ الخبر، حاول مرة أخرى.", "var(--danger)");
  } finally {
    publishBtn.disabled = false;
  }
}

function showStatus(text, color) {
  statusBox.innerText = text;
  statusBox.style.display = "block";
  statusBox.style.color = "white";
  statusBox.style.backgroundColor = color;
}

function createNewsItem(item) {
  const newsItem = document.createElement("div");
  newsItem.className = "news-item";

  const newsInfo = document.createElement("div");
  newsInfo.className = "news-info";

  const image = document.createElement("img");
  image.src = item.img || defaultImage;
  image.alt = item.title || "صورة الخبر";

  const title = document.createElement("span");
  title.textContent = item.title || "خبر بدون عنوان";

  const actions = document.createElement("div");
  actions.className = "news-actions";

  const editButton = document.createElement("button");
  editButton.className = "edit-btn";
  editButton.type = "button";
  editButton.title = "تعديل الخبر";
  editButton.innerHTML = '<i class="fas fa-pen-to-square"></i>';
  editButton.addEventListener("click", () => startEditNews(item));

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.type = "button";
  deleteButton.title = "حذف الخبر";
  deleteButton.addEventListener("click", () => deleteNews(item.id));

  const trashIcon = document.createElement("div");
  trashIcon.className = "trash-icon";

  newsInfo.append(image, title);
  deleteButton.appendChild(trashIcon);
  actions.append(editButton, deleteButton);
  newsItem.append(newsInfo, actions);

  return newsItem;
}

function startEditNews(item) {
  editingNewsId = item.id;
  editingOriginalImage = item.img || "";
  finalImageData = "";

  newsTitle.value = item.title || "";
  newsContent.value = item.content || "";
  newsType.value = item.type || "Company News";
  fileInput.value = "";

  if (editingOriginalImage) {
    imagePreview.src = editingOriginalImage;
    imagePreview.style.display = "block";
    uploadText.style.display = "none";
    removeImgBtn.style.display = "block";
  } else {
    imagePreview.style.display = "none";
    uploadText.style.display = "block";
    removeImgBtn.style.display = "none";
  }

  formTitle.innerHTML = '<i class="fas fa-pen"></i> تعديل الخبر';
  publishBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديل';
  cancelEditBtn.style.display = "block";
  updateLivePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadNews() {
  database
    .ref("news")
    .orderByChild("timestamp")
    .on("value", (snapshot) => {
      newsList.innerHTML = "";

      if (!snapshot.exists()) {
        newsList.innerHTML = '<p class="empty-message">لا توجد أخبار</p>';
        return;
      }

      const items = [];

      snapshot.forEach((child) => {
        items.push({ id: child.key, ...child.val() });
      });

      items.reverse().forEach((item) => {
        newsList.appendChild(createNewsItem(item));
      });
    });
}

async function deleteNews(id) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    await database.ref("news").child(id).remove();

    if (editingNewsId === id) {
      resetForm();
    }
  }
}

uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", processImage);
removeImgBtn.addEventListener("click", clearImage);
publishBtn.addEventListener("click", saveNews);
cancelEditBtn.addEventListener("click", resetForm);
newsTitle.addEventListener("input", updateLivePreview);
newsContent.addEventListener("input", updateLivePreview);
newsType.addEventListener("change", updateLivePreview);

updateLivePreview();
loadNews();
