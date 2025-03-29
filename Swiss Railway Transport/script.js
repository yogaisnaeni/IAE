const bannerImages = ["1.jpg", "2.jpg", "3.jpg"];
let currentIndex = 0;
const bannerImage = document.getElementById("bannerImage");

function changeBanner() {
    bannerImage.classList.add("fade-out");

    setTimeout(() => {
        currentIndex = (currentIndex + 1) % bannerImages.length;
        bannerImage.src = bannerImages[currentIndex];
        bannerImage.classList.remove("fade-out");
    }, 1500);
}

setInterval(changeBanner, 5000);

function updateSearchFields() {
    let searchType = document.getElementById("searchType").value;
    let inputFields = document.getElementById("inputFields");

    inputFields.innerHTML = "";

    if (searchType === "route") {
        inputFields.innerHTML = `
            <input type="text" id="departureInput" class="form-control mb-2" placeholder="Masukkan stasiun keberangkatan">
            <input type="text" id="arrivalInput" class="form-control mb-2" placeholder="Masukkan stasiun tujuan">
        `;
    } else if (searchType === "location") {
        inputFields.innerHTML = `
            <input type="text" id="departureInput" class="form-control mb-2" placeholder="Masukkan nama lokasi">
        `;
    } else if (searchType === "stationboard") {
        inputFields.innerHTML = `
            <input type="text" id="departureInput" class="form-control mb-2" placeholder="Masukkan nama stasiun">
        `;
    }
}

document.addEventListener("DOMContentLoaded", updateSearchFields);

function searchTransport() {
    let searchType = document.getElementById("searchType").value;
    let departure = document.getElementById("departureInput")?.value.trim();
    let arrival = document.getElementById("arrivalInput")?.value.trim();
    let transportList = document.getElementById("transport-list");

    if (!departure) {
        alert("Masukkan input yang sesuai!");
        return;
    }

    transportList.innerHTML = "<p class='text-center'>Mengambil data...</p>";

    let apiUrl = "";

    if (searchType === "route") {
        if (!arrival) {
            alert("Masukkan stasiun tujuan!");
            return;
        }
        apiUrl = `https://transport.opendata.ch/v1/connections?from=${departure}&to=${arrival}`;
    } else if (searchType === "location") {
        apiUrl = `https://transport.opendata.ch/v1/locations?query=${departure}`;
    } else if (searchType === "stationboard") {
        apiUrl = `https://transport.opendata.ch/v1/stationboard?station=${departure}&limit=${20}`;
    }

    console.log("Fetching data from:", apiUrl);

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            transportList.innerHTML = "";
            console.log("API Response:", data);

            if (searchType === "route") {
                displayRouteResults(data);
            } else if (searchType === "location") {
                displayLocationResults(data);
            } else if (searchType === "stationboard") {
                displayStationboardResults(data);
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            transportList.innerHTML = `<p class='text-danger'>Gagal mengambil data: ${error.message}</p>`;
        });
}

function displayRouteResults(data) {
    let transportList = document.getElementById("transport-list");

    if (!data.connections || data.connections.length === 0) {
        transportList.innerHTML = "<p class='text-warning'>Tidak ada rute ditemukan.</p>";
        return;
    }

    transportList.innerHTML = "<h3>Rute Tersedia:</h3>";
    data.connections.forEach(conn => {
        transportList.innerHTML += `
            <div class="card mb-2">
                <div class="card-body">
                    <p><strong>Dari:</strong> ${conn.from.station?.name || "Unknown"} - ${formatTime(conn.from.departure)}</p>
                    <p><strong>Ke:</strong> ${conn.to.station?.name || "Unknown"} - ${formatTime(conn.to.arrival)}</p>
                    <p><strong>Durasi:</strong> ${conn.duration.replace("00d", "")}</p>
                </div>
            </div>`;
    });
}

function displayLocationResults(data) {
    let transportList = document.getElementById("transport-list");

    if (!data.stations || data.stations.length === 0) {
        transportList.innerHTML = "<p class='text-warning'>Lokasi tidak ditemukan.</p>";
        return;
    }

    transportList.innerHTML = "<h3>Hasil Pencarian Lokasi Stasiun:</h3>";
    data.stations.forEach(station => {
        transportList.innerHTML += `
            <div class="card mb-2">
                <div class="card-body">
                    <p><strong>Nama Stasiun:</strong> ${station.name}</p>
                    <p><strong>Koordinat:</strong> Lat ${station.coordinate.x}, Lon ${station.coordinate.y}</p>
                </div>
            </div>`;
    });
}

function displayStationboardResults(data) {
    let transportList = document.getElementById("transport-list");

    if (!data.stationboard || data.stationboard.length === 0) {
        transportList.innerHTML = "<p class='text-warning'>Tidak ada data stationboard ditemukan.</p>";
        return;
    }

    transportList.innerHTML = "<h3>Jadwal Argo Keberangkatan:</h3>";
    data.stationboard.forEach(entry => {
        transportList.innerHTML += `
            <div class="card mb-2">
                <div class="card-body">
                    <p><strong>Nama Argo:</strong> ${entry.category} ${entry.number}</p>
                    <p><strong>Keberangkatan:</strong> ${formatTime(entry.stop.departure)}</p>
                    <p><strong>Destinasi:</strong> ${entry.to}</p>
                </div>
            </div>`;
    });
}

function formatTime(dateTime) {
    if (!dateTime) return "Unknown";
    let date = new Date(dateTime);
    return date.toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function printPDF() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Swiss Railway Information", 20, 20);

    let transportList = document.getElementById("transport-list");
    let content = transportList.innerText.trim();

    if (content === "") {
        alert("Tidak ada data untuk dicetak.");
        return;
    }

    let y = 30;
    let maxY = 280;
    let lines = content.split("\n");

    doc.setFontSize(12);
    lines.forEach(line => {
        if (y > maxY) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
    });

    doc.save("Swiss_Railway_Info.pdf");
}
