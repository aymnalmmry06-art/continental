const firebaseConfig = {
  databaseURL: "https://continental-f76a8-default-rtdb.firebaseio.com",
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
let finalImageData = "";

const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const uploadArea = document.getElementById("uploadArea");
const uploadText = document.getElementById("uploadText");
const removeImgBtn = document.getElementById("removeImgBtn");
const publishBtn = document.getElementById("publishBtn");
const newsTitle = document.getElementById("newsTitle");
const newsContent = document.getElementById("newsContent");
const newsType = document.getElementById("newsType");
const newsList = document.getElementById("newsList");
const statusBox = document.getElementById("status");

function processImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    finalImageData = e.target.result;
    imagePreview.src = finalImageData;
    imagePreview.style.display = "block";
    uploadText.style.display = "none";
    removeImgBtn.style.display = "block";
  };

  reader.readAsDataURL(file);
}

function clearImage() {
  finalImageData = "";
  fileInput.value = "";
  imagePreview.style.display = "none";
  uploadText.style.display = "block";
  removeImgBtn.style.display = "none";
}

async function publishNews() {
  const title = newsTitle.value;
  const content = newsContent.value;

  if (!title || !content) {
    alert("يرجى إدخال العنوان والمحتوى!");
    return;
  }

  publishBtn.disabled = true;
  showStatus("جاري النشر...", "var(--primary)");

  try {
    await database.ref("news").push({
      title: title,
      content: content,
      type: newsType.value,
      img: finalImageData || "https://via.placeholder.com/600x400?text=Continental",
      date: new Date().toLocaleDateString("en-GB"),
      timestamp: Date.now(),
    });

    showStatus("تم النشر!", "var(--success)");
    newsTitle.value = "";
    newsContent.value = "";
    clearImage();
  } catch (error) {
    showStatus("تعذر نشر الخبر، حاول مرة أخرى.", "var(--danger)");
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
  image.src = item.img;
  image.alt = item.title;

  const title = document.createElement("span");
  title.textContent = item.title;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.type = "button";
  deleteButton.addEventListener("click", () => deleteNews(item.id));

  const trashIcon = document.createElement("div");
  trashIcon.className = "trash-icon";

  newsInfo.append(image, title);
  deleteButton.appendChild(trashIcon);
  newsItem.append(newsInfo, deleteButton);

  return newsItem;
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
  }
}

uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", processImage);
removeImgBtn.addEventListener("click", clearImage);
publishBtn.addEventListener("click", publishNews);

loadNews();
