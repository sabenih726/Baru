import fitz  # PyMuPDF
from extractors import extract_sktt, extract_evln
from utils import generate_new_filename

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    return full_text

# Fungsi untuk memproses file PDF
def process_pdfs(uploaded_files, doc_type, use_name, use_passport):
    all_data = []
    renamed_files = {}
    
    # Buat folder sementara untuk menyimpan file
    temp_dir = tempfile.mkdtemp()
    
    for uploaded_file in uploaded_files:
        # Baca isi file PDF
        with pdfplumber.open(io.BytesIO(uploaded_file.read())) as pdf:
            texts = [page.extract_text() for page in pdf.pages if page.extract_text()]
            full_text = "\n".join(texts)
        
        # Ekstraksi data sesuai jenis dokumen
        if doc_type == "SKTT":
            extracted_data = extract_sktt(full_text)
        elif doc_type == "EVLN":
            extracted_data = extract_evln(full_text)
        elif doc_type == "ITAS":
            extracted_data = extract_itas(full_text)
        elif doc_type == "ITK":
            extracted_data = extract_itk(full_text)
        elif doc_type == "Notifikasi":
            extracted_data = extract_notifikasi(full_text)
        else:
            extracted_data = {}
        
        all_data.append(extracted_data)
        
        # Buat nama file baru
        new_filename = generate_new_filename(extracted_data, use_name, use_passport)
        
        # Simpan file dengan nama baru di folder sementara
        temp_file_path = os.path.join(temp_dir, new_filename)
        with open(temp_file_path, 'wb') as f:
            # Reset file pointer dan tulis file asli dengan nama baru
            uploaded_file.seek(0)
            f.write(uploaded_file.read())
        
        renamed_files[uploaded_file.name] = {'new_name': new_filename, 'path': temp_file_path}
    
    # Buat DataFrame dari data yang diekstrak
    df = pd.DataFrame(all_data)
    
    # Simpan DataFrame ke Excel
    excel_path = os.path.join(temp_dir, "Hasil_Ekstraksi.xlsx")
    df.to_excel(excel_path, index=False)
    
    # Buat ZIP dari semua file yang direname
    zip_path = os.path.join(temp_dir, "Renamed_Files.zip")
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file_info in renamed_files.values():
            zipf.write(file_info['path'], arcname=file_info['new_name'])
    
    return df, excel_path, renamed_files, zip_path, temp_dir
