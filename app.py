import streamlit as st
import os
import pandas as pd
import io
from file_processing import process_pdfs, process_passport_images  # OCR fungsi sudah ditambahkan
from utils import get_greeting, get_binary_file_downloader_html

# Konfigurasi halaman
st.set_page_config(page_title="Ekstraksi & Rename PDF Dokumen Imigrasi", layout="wide")

# Custom CSS dengan Tailwind-like styling
st.markdown("""
<style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Root variables */
    :root {
        --primary-color: #3b82f6;
        --primary-dark: #1d4ed8;
        --secondary-color: #64748b;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --background: #f8fafc;
        --surface: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --border: #e2e8f0;
        --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    
    /* Global styles */
    .main {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 1rem;
    }
    
    .stApp {
        background: transparent;
    }
    
    /* Header container */
    .header-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    /* Main content container */
    .content-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-lg);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    /* Custom title styling */
    .custom-title {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
        margin-bottom: 0.5rem;
        line-height: 1.2;
    }
    
    .custom-subtitle {
        text-align: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }
    
    /* Radio button styling */
    .stRadio > div {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        justify-content: center;
        margin: 1.5rem 0;
    }
    
    .stRadio > div > label {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 0.75rem;
        padding: 1rem 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        min-width: 200px;
        text-align: center;
    }
    
    .stRadio > div > label:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow);
    }
    
    .stRadio > div > label[data-checked="true"] {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }
    
    /* Selectbox styling */
    .stSelectbox > div > div {
        border-radius: 0.5rem;
        border: 2px solid var(--border);
        background: var(--surface);
    }
    
    .stSelectbox > div > div:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* Checkbox styling */
    .checkbox-container {
        display: flex;
        gap: 2rem;
        justify-content: center;
        margin: 1.5rem 0;
        flex-wrap: wrap;
    }
    
    .custom-checkbox {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 0.75rem;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .custom-checkbox:hover {
        border-color: var(--primary-color);
        transform: translateY(-1px);
    }
    
    /* File uploader styling */
    .stFileUploader > div {
        border: 2px dashed var(--border);
        border-radius: 1rem;
        padding: 2rem;
        background: var(--surface);
        transition: all 0.3s ease;
    }
    
    .stFileUploader > div:hover {
        border-color: var(--primary-color);
        background: rgba(59, 130, 246, 0.02);
    }
    
    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        color: white;
        border: none;
        border-radius: 0.75rem;
        padding: 0.75rem 2rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        margin: 1rem 0;
        box-shadow: var(--shadow);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    /* Download button styling */
    .download-button {
        display: inline-block;
        background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
        color: white;
        text-decoration: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        margin: 0.5rem;
        transition: all 0.3s ease;
        box-shadow: var(--shadow);
    }
    
    .download-button:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
        text-decoration: none;
        color: white;
    }
    
    /* Alert/Info styling */
    .stAlert {
        border-radius: 0.75rem;
        border: none;
        box-shadow: var(--shadow);
    }
    
    .stSuccess {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
        border-left: 4px solid var(--success-color);
    }
    
    .stInfo {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%);
        border-left: 4px solid var(--primary-color);
    }
    
    /* Table styling */
    .stDataFrame {
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: var(--shadow);
    }
    
    /* Spinner styling */
    .stSpinner > div {
        border-color: var(--primary-color) !important;
    }
    
    /* Section headers */
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 2rem 0 1rem 0;
        text-align: center;
        position: relative;
    }
    
    .section-header::after {
        content: '';
        display: block;
        width: 3rem;
        height: 3px;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        margin: 0.5rem auto;
        border-radius: 2px;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .stRadio > div {
            flex-direction: column;
        }
        
        .checkbox-container {
            flex-direction: column;
            align-items: center;
        }
        
        .custom-title {
            font-size: 2rem;
        }
    }
</style>
""", unsafe_allow_html=True)

# Header Section
st.markdown('<div class="header-container">', unsafe_allow_html=True)
st.markdown(f'<h1 class="custom-title">{get_greeting()}</h1>', unsafe_allow_html=True)
st.markdown('<p class="custom-subtitle">Semoga Ibu Direktur Senang Dengan Aplikasi Ini</p>', unsafe_allow_html=True)
st.markdown('</div>', unsafe_allow_html=True)

# Main Content
st.markdown('<div class="content-container">', unsafe_allow_html=True)

# Pilih mode: PDF biasa atau OCR paspor
st.markdown('<h2 class="section-header">Pilih Mode Ekstraksi</h2>', unsafe_allow_html=True)
mode = st.radio("", ["Ekstraksi PDF Dokumen", "OCR Paspor Tiongkok"], label_visibility="collapsed")

if mode == "Ekstraksi PDF Dokumen":
    st.markdown('<h3 class="section-header">Konfigurasi Dokumen</h3>', unsafe_allow_html=True)
    
    # Pilih jenis dokumen
    doc_type = st.selectbox(
        "Pilih Jenis Dokumen",
        ["SKTT", "EVLN", "ITAS", "ITK", "Notifikasi"]
    )

    # Opsi pengaturan nama file
    st.markdown('<h3 class="section-header">Opsi Penamaan File</h3>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        use_name = st.checkbox("Gunakan Nama", value=True)
    with col2:
        use_passport = st.checkbox("Gunakan Nomor Paspor", value=True)

    # Upload file PDF
    st.markdown('<h3 class="section-header">Upload File PDF</h3>', unsafe_allow_html=True)
    uploaded_files = st.file_uploader("Unggah satu atau beberapa file PDF", type=["pdf"], accept_multiple_files=True)

    # Tombol proses
    if st.button("🚀 Mulai Proses Ekstraksi") and uploaded_files:
        with st.spinner("Memproses file... Harap tunggu."):
            df, excel_path, renamed_files, zip_path, temp_dir = process_pdfs(
                uploaded_files, doc_type, use_name, use_passport
            )

        st.success("✅ Ekstraksi selesai!")

        # Tampilkan tabel hasil
        st.markdown('<h3 class="section-header">Hasil Ekstraksi</h3>', unsafe_allow_html=True)
        st.dataframe(df, use_container_width=True)

        # Tombol download
        col1, col2 = st.columns(2)
        
        with col1:
            with open(excel_path, "rb") as f:
                st.download_button(
                    "📥 Unduh Hasil Excel",
                    data=f.read(),
                    file_name="Hasil_Ekstraksi.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )

        with col2:
            with open(zip_path, "rb") as f:
                st.download_button(
                    "📦 Unduh Semua PDF (ZIP)",
                    data=f.read(),
                    file_name="Renamed_Files.zip",
                    mime="application/zip"
                )

        # Tampilkan daftar rename
        st.markdown('<h3 class="section-header">Perubahan Nama File</h3>', unsafe_allow_html=True)
        for old_name, info in renamed_files.items():
            st.markdown(f"**{old_name}** → `{info['new_name']}`")

    elif uploaded_files:
        st.info("💡 Klik tombol **Mulai Proses Ekstraksi** untuk memulai.")

# OCR Paspor Section
elif mode == "OCR Paspor Tiongkok":
    st.markdown('<h3 class="section-header">Upload Gambar Paspor</h3>', unsafe_allow_html=True)
    uploaded_images = st.file_uploader("Unggah satu atau beberapa gambar paspor (JPEG/PNG)", type=["jpg", "jpeg", "png"], accept_multiple_files=True)

    if st.button("🔎 Mulai OCR") and uploaded_images:
        with st.spinner("Memproses gambar paspor..."):
            df_ocr = process_passport_images(uploaded_images)
            
        st.success("✅ Ekstraksi OCR selesai!")

        st.markdown('<h3 class="section-header">Hasil Ekstraksi Paspor</h3>', unsafe_allow_html=True)
        st.dataframe(df_ocr, use_container_width=True)

        # Export to Excel
        to_excel = io.BytesIO()
        with pd.ExcelWriter(to_excel, engine="xlsxwriter") as writer:
            df_ocr.to_excel(writer, index=False)
        to_excel.seek(0)

        st.download_button(
            "📥 Unduh Hasil Excel", 
            data=to_excel,
            file_name="Hasil_OCR_Paspor.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    elif uploaded_images:
        st.info("💡 Klik tombol **Mulai OCR** untuk memulai proses ekstraksi.")

st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("""
<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
    <p>© 2024 Aplikasi Ekstraksi & Rename PDF Dokumen Imigrasi</p>
    <p>Dibuat dengan ❤️ menggunakan Streamlit & Tailwind CSS</p>
</div>
""", unsafe_allow_html=True)
