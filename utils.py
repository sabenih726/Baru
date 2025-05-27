import re
from datetime import datetime

# Sanitize nama file
def sanitize_filename_part(text):
    # Biarkan spasi dan tanda hubung, hapus karakter ilegal lainnya
    return re.sub(r'[^\w\s-]', '', text).strip()

# Fungsi untuk format tanggal
def format_date(date_str):
    match = re.search(r"(\d{2})[-/](\d{2})[-/](\d{4})", date_str)
    if match:
        day, month, year = match.groups()
        return f"{day}/{month}/{year}"
    return date_str

# Buat nama file baru berdasarkan data yang diekstrak
def generate_new_filename(extracted_data, use_name=True, use_passport=True):
    # Ambil value nama dari berbagai kemungkinan key
    name_raw = (
        extracted_data.get("Name") or
        extracted_data.get("Nama TKA") or
        ""
    )

    # Ambil value paspor dari berbagai kemungkinan key
    passport_raw = (
        extracted_data.get("Passport Number") or
        extracted_data.get("Nomor Paspor") or
        extracted_data.get("Passport No") or
        extracted_data.get("KITAS/KITAP") or  # Tambahan untuk SKTT
        ""
    )

    # Bersihkan isi nama dan paspor
    name = sanitize_filename_part(name_raw) if use_name and name_raw else ""
    passport = sanitize_filename_part(passport_raw) if use_passport and passport_raw else ""

    # Gabungkan untuk nama file dengan spasi
    parts = [p for p in [name, passport] if p]
    base_name = " ".join(parts) if parts else "RENAMED"
    
    return f"{base_name}.pdf"
