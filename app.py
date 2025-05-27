import streamlit as st
import os
from file_processing import process_pdfs
from utils import get_greeting, get_binary_file_downloader_html

# Konfigurasi halaman
st.set_page_config(page_title="Ekstraksi & Rename PDF Dokumen Imigrasi", layout="wide")

# Judul Aplikasi
st.markdown(f"## {get_greeting()}, Selamat datang di Aplikasi Ekstraksi Dokumen Imigrasi 🇮🇩")
st.markdown("---")

# Pilih jenis dokumen
doc_type = st.selectbox(
    "Pilih Jenis Dokumen",
    ["SKTT", "EVLN", "ITAS", "ITK", "Notifikasi"]
)

# Opsi pengaturan nama file
st.markdown("### Opsi Penamaan File")
use_name = st.checkbox("Gunakan Nama", value=True)
use_passport = st.checkbox("Gunakan Nomor Paspor", value=True)

# Upload file PDF
uploaded_files = st.file_uploader("Unggah satu atau beberapa file PDF", type=["pdf"], accept_multiple_files=True)

# Tombol proses
if st.button("Mulai Proses Ekstraksi") and uploaded_files:
    with st.spinner("Memproses file... Harap tunggu."):
        df, excel_path, renamed_files, zip_path, temp_dir = process_pdfs(
            uploaded_files, doc_type, use_name, use_passport
        )

    st.success("Ekstraksi selesai!")

    # Tampilkan tabel hasil
    st.markdown("### Hasil Ekstraksi")
    st.dataframe(df)

    # Tombol download file Excel
    with open(excel_path, "rb") as f:
        st.markdown(get_binary_file_downloader_html(f.read(), "Hasil_Ekstraksi.xlsx", "📥 Unduh Hasil Excel"), unsafe_allow_html=True)

    # Tombol download file ZIP
    with open(zip_path, "rb") as f:
        st.markdown(get_binary_file_downloader_html(f.read(), "Renamed_Files.zip", "📦 Unduh Semua PDF (ZIP)"), unsafe_allow_html=True)

    # Tampilkan daftar rename
    st.markdown("### Perubahan Nama File")
    for old_name, info in renamed_files.items():
        st.markdown(f"- **{old_name}** → `{info['new_name']}`")

elif uploaded_files:
    st.info("Klik tombol **Mulai Proses Ekstraksi** untuk memulai.")
