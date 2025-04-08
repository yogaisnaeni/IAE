const API_URL = "http://localhost:5000/api/barang";

let editingId = null;
let selectedItemId = null;

// Load data saat halaman dibuka
window.onload = loadItems;

async function loadItems() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            const errorData = await res.json();
            console.error("Gagal memuat data:", errorData);
            return;
        }
        const items = await res.json();
        console.log("Data dari backend:", items);

        // Isi Tabel
        const itemTableBody = document.getElementById("itemTableBody");
        itemTableBody.innerHTML = ""; // Bersihkan tabel

        items.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.nama}</td>
                <td>${item.jumlah}</td>
                <td>${item.kategori}</td>
                <td>${item.foto ? `<img src="/uploads/${item.foto}" alt="${item.nama}">` : 'No Image'}</td>
                <td>
                    <button onclick="previewItem(${item.id})">Preview</button>
                    <button onclick="openEditModal(${item.id}, '${item.nama}', ${item.jumlah}, '${item.kategori}')">Edit</button>
                    <button onclick="openDeleteModal(${item.id})">Hapus</button>
                </td>
            `;
            itemTableBody.appendChild(row);
        });

        // Isi Grid Kartu (seperti sebelumnya)
        const itemGrid = document.getElementById("itemGrid");
        itemGrid.innerHTML = "";

        items.forEach((item) => {
            const card = document.createElement("div");
            card.classList.add("item-card");
            card.innerHTML = `
                ${item.foto ? `<img src="/uploads/${item.foto}" alt="${item.nama}">` : '<div class="no-image">No Image</div>'}
                <h3>${item.nama}</h3>
                <p>Jumlah: ${item.jumlah}</p>
                <p>Kategori: ${item.kategori}</p>
                <div class="actions">
                    <button onclick="previewItem(${item.id})">Preview</button>
                    <button onclick="openEditModal(${item.id}, '${item.nama}', ${item.jumlah}, '${item.kategori}')">Edit</button>
                    <button onclick="openDeleteModal(${item.id})">Hapus</button>
                </div>
            `;
            itemGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Terjadi kesalahan saat memuat data:", error);
    }
}

document.getElementById("addButton").addEventListener("click", async (e) => {
    const nama = document.getElementById("nama").value;
    const jumlah = document.getElementById("jumlah").value;
    const kategori = document.getElementById("kategori").value;
    const fotoInput = document.getElementById("foto");
    const foto = fotoInput.files[0];

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("jumlah", jumlah);
    formData.append("kategori", kategori);
    if (foto) {
        formData.append("foto", foto);
    }

    let method = "POST";
    let url = API_URL;
    if (editingId) {
        method = "PUT";
        url = `${API_URL}/${editingId}`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gagal menambahkan data:", errorData);
            return;
        }

        const responseData = await response.json();
        console.log("Data berhasil ditambahkan:", responseData);

        // Muat ulang data untuk memperbarui tabel dan grid
        loadItems();
        document.getElementById("itemForm").reset();
        editingId = null;

    } catch (error) {
        console.error("Terjadi kesalahan saat menambahkan data:", error);
    }
});

function openEditModal(id, nama, jumlah, kategori) {
    editingId = id;
    document.getElementById("editNama").value = nama;
    document.getElementById("editJumlah").value = jumlah;
    document.getElementById("editKategori").value = kategori;
    document.getElementById("editModal").style.display = "block";
}

async function submitEdit() {
    const nama = document.getElementById("editNama").value;
    const jumlah = document.getElementById("editJumlah").value;
    const kategori = document.getElementById("editKategori").value;
    const fotoInput = document.getElementById("editFoto");
    const foto = fotoInput.files[0];

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("jumlah", jumlah);
    formData.append("kategori", kategori);
    if (foto) {
        formData.append("foto", foto);
    }

    await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        body: formData,
    });

    closeEditModal();
    loadItems();
    editingId = null;
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function openDeleteModal(id) {
    selectedItemId = id;
    document.getElementById("deleteModal").style.display = "block";
}

async function confirmDelete() {
    await fetch(`${API_URL}/${selectedItemId}`, {
        method: "DELETE",
    });
    closeDeleteModal();
    loadItems();
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

async function previewItem(id) {
    const res = await fetch(`${API_URL}/${id}`);
    const item = await res.json();

    document.getElementById("previewNama").innerText = item.nama;
    document.getElementById("previewJumlah").innerText = item.jumlah;
    document.getElementById("previewKategori").innerText = item.kategori;
    document.getElementById("previewFoto").src = `/uploads/${item.foto}`;
    document.getElementById("previewModal").style.display = "block";
}

function closePreviewModal() {
    document.getElementById("previewModal").style.display = "none";
}