import streamlit as st
import os
import pandas as pd
import io
from file_processing import process_pdfs, process_passport_images  # OCR fungsi sudah ditambahkan
from utils import get_greeting, get_binary_file_downloader_html

# Konfigurasi halaman
st.set_page_config(page_title="Ekstraksi & Rename PDF Dokumen Imigrasi", layout="wide")

# Custom CSS yang lebih sederhana dan kompatibel
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    .main {
        font-family: 'Inter', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    
    .header-container {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        padding: 30px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .content-container {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        padding: 30px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .custom-title {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-bottom: 10px;
    }
    
    .custom-subtitle {
        text-align: center;
        color: #64748b;
        font-size: 1.1rem;
        margin-bottom: 20px;
    }
    
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        text-align: center;
        margin: 30px 0 20px 0;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 10px;
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 16px;
        width: 100%;
        margin: 15px 0;
        transition: transform 0.2s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }
    
    .stSelectbox > div > div {
        border-radius: 8px;
        border: 2px solid #e2e8f0;
        background: white;
    }
    
    .stFileUploader > div {
        border: 2px dashed #3b82f6;
        border-radius: 12px;
        padding: 30px;
        background: rgba(59, 130, 246, 0.05);
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .stFileUploader > div:hover {
        border-color: #1d4ed8;
        background: rgba(59, 130, 246, 0.1);
    }
    
    .stFileUploader [data-testid="stFileUploaderDropzone"] {
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .stProgress > div > div {
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    }
    
    .stAlert {
        border-radius: 10px;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .stDataFrame {
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
st.markdown('<h2 class="section-header">📋 Pilih Mode Ekstraksi</h2>', unsafe_allow_html=True)
mode = st.radio("", ["Ekstraksi PDF Dokumen", "OCR Paspor Tiongkok"], label_visibility="collapsed")

if mode == "Ekstraksi PDF Dokumen":
    st.markdown('<h3 class="section-header">⚙️ Konfigurasi Dokumen</h3>', unsafe_allow_html=True)
    
    # Pilih jenis dokumen
    doc_type = st.selectbox(
        "Pilih Jenis Dokumen",
        ["SKTT", "EVLN", "ITAS", "ITK", "Notifikasi"]
    )

    # Opsi pengaturan nama file
    st.markdown('<h3 class="section-header">📝 Opsi Penamaan File</h3>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        use_name = st.checkbox("✅ Gunakan Nama", value=True)
    with col2:
        use_passport = st.checkbox("🔢 Gunakan Nomor Paspor", value=True)

    # Upload file PDF
    st.markdown('<h3 class="section-header">📁 Upload File PDF</h3>', unsafe_allow_html=True)
    uploaded_files = st.file_uploader(
        "Drag & drop file PDF di sini atau klik untuk browse", 
        type=["pdf"], 
        accept_multiple_files=True,
        key="pdf_uploader"
    )

    # Tampilkan info file yang diupload
    if uploaded_files:
        st.info(f"📄 {len(uploaded_files)} file PDF berhasil diupload")
        with st.expander("👁️ Lihat daftar file", expanded=False):
            for i, file in enumerate(uploaded_files, 1):
                file_size = len(file.getvalue()) / (1024 * 1024)  # Convert to MB
                st.write(f"{i}. **{file.name}** ({file_size:.2f} MB)")

    # Tombol proses - disabled jika tidak ada file
    process_disabled = not uploaded_files
    
    if st.button("🚀 Mulai Proses Ekstraksi", disabled=process_disabled):
        if uploaded_files:
            # Progress bar
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            try:
                status_text.text("⏳ Memulai proses ekstraksi...")
                progress_bar.progress(10)
                
                status_text.text("📄 Memproses file PDF...")
                progress_bar.progress(30)
                
                df, excel_path, renamed_files, zip_path, temp_dir = process_pdfs(
                    uploaded_files, doc_type, use_name, use_passport
                )
                
                progress_bar.progress(90)
                status_text.text("✅ Menyelesaikan proses...")
                progress_bar.progress(100)
                
                # Clear progress indicators
                progress_bar.empty()
                status_text.empty()
                
                st.success("✅ Ekstraksi selesai!")

                # Tampilkan tabel hasil
                st.markdown('<h3 class="section-header">📊 Hasil Ekstraksi</h3>', unsafe_allow_html=True)
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
                st.markdown('<h3 class="section-header">📄 Perubahan Nama File</h3>', unsafe_allow_html=True)
                for old_name, info in renamed_files.items():
                    st.markdown(f"**{old_name}** ➡️ `{info['new_name']}`")

            except Exception as e:
                # Clear progress indicators on error
                progress_bar.empty()
                status_text.empty()
                st.error(f"❌ Terjadi kesalahan saat memproses PDF: {str(e)}")
                st.error("💡 **Tips troubleshooting:**")
                st.write("- Pastikan file PDF tidak corrupt atau password-protected")
                st.write("- Coba dengan file PDF yang lebih kecil")
                st.write("- Pastikan file PDF berisi teks yang bisa diekstrak")
        else:
            st.error("❌ Tidak ada file yang diupload!")

    
    # Info untuk user
    if not uploaded_files:
        st.warning("⚠️ Silakan upload file PDF terlebih dahulu")
    elif process_disabled:
        st.info("💡 Klik tombol **Mulai Proses Ekstraksi** untuk memulai.")

# OCR Paspor Section
elif mode == "OCR Paspor Tiongkok":
    st.markdown('<h3 class="section-header">🖼️ Upload Gambar Paspor</h3>', unsafe_allow_html=True)
    uploaded_images = st.file_uploader(
        "Upload gambar paspor (JPEG/PNG)", 
        type=["jpg", "jpeg", "png"], 
        accept_multiple_files=True,
        key="image_uploader"
    )
    
    # Tampilkan info gambar yang diupload
    if uploaded_images:
        st.info(f"🖼️ {len(uploaded_images)} gambar berhasil diupload")
        with st.expander("👁️ Lihat daftar gambar", expanded=False):
            for i, img in enumerate(uploaded_images, 1):
                img_size = len(img.getvalue()) / (1024 * 1024)  # Convert to MB
                st.write(f"{i}. **{img.name}** ({img_size:.2f} MB)")

    # Tombol OCR - disabled jika tidak ada gambar
    ocr_disabled = not uploaded_images
    
    if st.button("🔎 Mulai OCR", disabled=ocr_disabled):
        if uploaded_images:
            # Progress bar untuk OCR
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            try:
                status_text.text("⏳ Memulai proses OCR...")
                progress_bar.progress(10)
                
                status_text.text("🖼️ Memproses gambar paspor...")
                progress_bar.progress(30)
                
                df_ocr = process_passport_images(uploaded_images)
                
                progress_bar.progress(90)
                status_text.text("✅ Menyelesaikan OCR...")
                progress_bar.progress(100)
                
                # Clear progress indicators
                progress_bar.empty()
                status_text.empty()
                
                st.success("✅ Ekstraksi OCR selesai!")

                st.markdown('<h3 class="section-header">📊 Hasil Ekstraksi Paspor</h3>', unsafe_allow_html=True)
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
            except Exception as e:
                # Clear progress indicators on error
                progress_bar.empty()
                status_text.empty()
                st.error(f"❌ Terjadi kesalahan saat OCR: {str(e)}")
                st.error("💡 **Tips troubleshooting:**")
                st.write("- Pastikan gambar berkualitas baik dan tidak blur")
                st.write("- Pastikan format file adalah JPG, JPEG, atau PNG")
                st.write("- Coba dengan gambar yang lebih kecil jika file terlalu besar")
    
    # Info untuk user OCR
    if not uploaded_images:
        st.warning("⚠️ Silakan upload gambar paspor terlebih dahulu")
    elif uploaded_images and not st.session_state.get('ocr_processed', False):
        st.info("💡 Klik tombol **Mulai OCR** untuk memulai proses ekstraksi.")

st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("""
<div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
    <p>© 2024 Aplikasi Ekstraksi & Rename PDF Dokumen Imigrasi</p>
    <p>Dibuat dengan ❤️ menggunakan Streamlit</p>
</div>
""", unsafe_allow_html=True)
