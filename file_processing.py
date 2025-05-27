import os
import io
import tempfile
import zipfile
import fitz  # PyMuPDF
import pdfplumber
import pandas as pd
import easyocr
import numpy as np
from extractors import extract_sktt, extract_evln, extract_itas, extract_itk, extract_notifikasi
from utils import generate_new_filename
from PIL import Image

reader = easyocr.Reader(['en', 'ch_sim'], gpu=False)

def extract_passport_fields_accurate(lines):
    fields = {
        "Name": "",
        "Date of Birth": "",
        "Place of Birth": "",
        "Passport No": "",
        "Expired Date": ""
    }

    mrz_lines = [l for l in lines if re.search(r'^[A-Z0-9<]{30,}', l.replace(" ", ""))]

    for mrz in mrz_lines:
        match = re.search(r'(EK\d{7})', mrz.replace(" ", ""))
        if match:
            fields["Passport No"] = match.group(1)
            break

    for i, line in enumerate(lines):
        if "姓名" in line or "Name" in line:
            for j in range(i+1, min(i+4, len(lines))):
                candidate = lines[j].strip()
                if re.fullmatch(r'[A-Z]{2,}', candidate.replace(" ", "")):
                    name_parts = [part.strip() for part in lines[j:j+2] if part.strip().isalpha()]
                    fields["Name"] = " ".join(name_parts).upper()
                    break
            break

    for line in lines:
        if re.search(r'\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}', line.upper()):
            fields["Date of Birth"] = line.strip()
            break

    for line in lines:
        if "出生地点" in line or "Place of bin" in line or "SHANDONG" in line.upper():
            fields["Place of Birth"] = "SHANDONG"
            break

    for i, line in enumerate(lines):
        lower_line = line.lower()
        if "date of expiry" in lower_line or "有效划至" in lower_line:
            combined = ""
            for j in range(i+1, min(i+5, len(lines))):
                combined += " " + lines[j].strip()
            combined = combined.strip()
            match = re.search(r'(\d{1,2})\s+[^\s]*月/\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})', combined.upper())
            if match:
                fields["Expired Date"] = f"{match.group(1)} {match.group(2)} {match.group(3)}"
            break

    return fields

def process_passport_images(uploaded_images):
    data = []
    for uploaded_image in uploaded_images:
        image = Image.open(uploaded_image).convert("RGB")
        result = reader.readtext(np.array(image), detail=0)
        fields = extract_passport_fields_accurate(result)
        data.append(fields)
    return pd.DataFrame(data)

# Fungsi untuk membaca teks dari PDF dengan pdfplumber
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

    # Buat folder sementara untuk menyimpan file hasil sementara
    temp_dir = tempfile.mkdtemp()

    for uploaded_file in uploaded_files:
        # Baca teks dari PDF
        with pdfplumber.open(io.BytesIO(uploaded_file.read())) as pdf:
            texts = [page.extract_text() for page in pdf.pages if page.extract_text()]
            full_text = "\n".join(texts)

        # Ekstraksi data berdasarkan tipe dokumen
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

        # Generate nama file baru
        new_filename = generate_new_filename(extracted_data, use_name, use_passport)

        # Simpan file dengan nama baru di direktori sementara
        temp_file_path = os.path.join(temp_dir, new_filename)
        uploaded_file.seek(0)
        with open(temp_file_path, 'wb') as f:
            f.write(uploaded_file.read())

        renamed_files[uploaded_file.name] = {'new_name': new_filename, 'path': temp_file_path}

    # Buat DataFrame dari hasil ekstraksi
    df = pd.DataFrame(all_data)

    # Simpan DataFrame ke Excel
    excel_path = os.path.join(temp_dir, "Hasil_Ekstraksi.xlsx")
    df.to_excel(excel_path, index=False)

    # Buat file ZIP dari file-file PDF yang telah dinamai ulang + Excel
    zip_path = os.path.join(temp_dir, "Hasil_Ekstraksi.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(excel_path, arcname="Hasil_Ekstraksi.xlsx")
        for file_info in renamed_files.values():
            zipf.write(file_info['path'], arcname=file_info['new_name'])

    return df, excel_path, renamed_files, zip_path, temp_dir
