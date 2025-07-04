import { getProducts, saveProducts } from "@/lib/localStorage"

// Tambahkan fungsi untuk update stok setelah transaksi
export const updateProductStock = (productId: string, quantitySold: number) => {
  const products = getProducts()
  const updatedProducts = products.map((product) => {
    if (product.id === productId && product.stock !== undefined) {
      return {
        ...product,
        stock: Math.max(0, product.stock - quantitySold), // Pastikan stok tidak negatif
      }
    }
    return product
  })

  saveProducts(updatedProducts)
  return updatedProducts
}

// Fungsi untuk update multiple products sekaligus
export const updateMultipleProductStock = (items: Array<{ id: string; quantity: number }>) => {
  const products = getProducts()
  const updatedProducts = products.map((product) => {
    const soldItem = items.find((item) => item.id === product.id)
    if (soldItem && product.stock !== undefined) {
      return {
        ...product,
        stock: Math.max(0, product.stock - soldItem.quantity),
      }
    }
    return product
  })

  saveProducts(updatedProducts)
  return updatedProducts
}
