import streamlit as st
import os
import pandas as pd
import io
from file_processing import process_pdfs, process_passport_images  # OCR fungsi sudah ditambahkan
from utils import get_greeting, get_binary_file_downloader_html

# Konfigurasi halaman
st.set_page_config(page_title="Ekstraksi & Rename PDF Dokumen Imigrasi", layout="wide")

# Judul Aplikasi
st.markdown(f"## {get_greeting()}, Selamat datang di Aplikasi Ekstraksi Dokumen Imigrasi 🇮🇩")
st.markdown("---")

# Pilih mode: PDF biasa atau OCR paspor
mode = st.radio("Pilih Mode Ekstraksi", ["Ekstraksi PDF Dokumen", "OCR Paspor Tiongkok"])

if mode == "Ekstraksi PDF Dokumen":
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

# 🔽 Tambahan OCR Paspor
elif mode == "OCR Paspor Tiongkok":
    st.markdown("### Upload Gambar Paspor (JPEG/PNG)")
    uploaded_images = st.file_uploader("Unggah satu atau beberapa gambar", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    if st.button("Mulai OCR") and uploaded_images:
        with st.spinner("Memproses gambar paspor..."):
            df_ocr = process_passport_images(uploaded_images)
            st.success("Ekstraksi OCR selesai!")

            st.markdown("### Tabel Hasil Ekstraksi Paspor")
            st.dataframe(df_ocr)

            to_excel = io.BytesIO()
            with pd.ExcelWriter(to_excel, engine="xlsxwriter") as writer:
                df_ocr.to_excel(writer, index=False)
            to_excel.seek(0)

            st.download_button("📥 Unduh Hasil Excel", data=to_excel,
                               file_name="Hasil_OCR_Paspor.xlsx",
                               mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
