import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activePage, setActivePage] = useState('Dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/products')

        if (!response.ok) {
          throw new Error('Gagal mengambil data produk.')
        }

        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error(error)
        alert('Gagal mengambil produk dari server Laravel.')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  const [transactionForm, setTransactionForm] = useState({
    productId: '',
    quantity: '1',
  })

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    price: '',
  })

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  )

  const totalRevenue = transactions.reduce(
    (total, transaction) => total + transaction.total,
    0
  )

  const totalItemsSold = transactions.reduce(
    (total, transaction) => total + transaction.quantity,
    0
  )

  const productSales = transactions.reduce((sales, transaction) => {
    sales[transaction.productId] =
      (sales[transaction.productId] || 0) + transaction.quantity

    return sales
  }, {})

  const bestSellingProduct = products
    .map((product) => ({
      ...product,
      sold: productSales[product.id] || 0,
    }))
    .filter((product) => product.sold > 0)
    .sort((a, b) => b.sold - a.sold)[0]

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  async function handleAddProduct(event) {
    event.preventDefault()

    const newProduct = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      stock: Number(formData.stock),
      price: Number(formData.price),
    }

    if (
      !newProduct.name ||
      !newProduct.category ||
      formData.stock === '' ||
      formData.price === '' ||
      !Number.isInteger(newProduct.stock) ||
      newProduct.stock < 0 ||
      !Number.isFinite(newProduct.price) ||
      newProduct.price < 0
    ) {
      alert('Lengkapi semua data dengan benar.')
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newProduct),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Object.values(data.errors || {}).flat().join('\n') ||
          data.message ||
          'Gagal menyimpan produk.'
        )
      }

      setProducts((currentProducts) => [data, ...currentProducts])

      setFormData({
        name: '',
        category: '',
        stock: '',
        price: '',
      })

      setShowForm(false)
      alert('Produk berhasil disimpan ke database!')
    } catch (error) {
      console.error(error)
      alert(error.message || 'Tidak dapat terhubung ke server Laravel.')
    }
  }

  async function handleDeleteProduct(id) {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus produk ini?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/products/${id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))

        throw new Error(
          data.message || 'Gagal menghapus produk.'
        )
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      )

      alert('Produk berhasil dihapus!')
    } catch (error) {
      console.error(error)
      alert(error.message || 'Tidak dapat terhubung ke server Laravel.')
    }
  }

  function handleUpdateStock(id, amount) {
    const product = products.find((product) => product.id === id)

    if (!product) return

    if (product.stock + amount < 0) {
      alert('Stok tidak boleh kurang dari 0.')
      return
    }

    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, stock: product.stock + amount }
          : product
      )
    )
  }

  function handleTransactionSubmit(event) {
    event.preventDefault()

    const productId = Number(transactionForm.productId)
    const quantity = Number(transactionForm.quantity)

    const product = products.find(
      (product) => product.id === productId
    )

    if (!product) {
      alert('Pilih produk terlebih dahulu.')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert('Jumlah pembelian harus berupa bilangan bulat positif.')
      return
    }

    if (quantity > product.stock) {
      alert('Stok tidak mencukupi.')
      return
    }

    const newTransaction = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      total: product.price * quantity,
      date: new Date().toLocaleString('id-ID'),
    }

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? { ...item, stock: item.stock - quantity }
          : item
      )
    )

    setTransactions((currentTransactions) => [
      ...currentTransactions,
      newTransaction,
    ])

    setTransactionForm({
      productId: '',
      quantity: '1',
    })

    alert('Transaksi berhasil disimpan!')
  }

  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">SmartStock</h2>

        <nav>
          {['Dashboard', 'Produk', 'Stok Barang', 'Transaksi', 'Laporan'].map(
            (page) => (
              <button
                key={page}
                type="button"
                className={`nav-link ${activePage === page ? 'active' : ''}`}
                onClick={() => setActivePage(page)}
              >
                {page}
              </button>
            )
          )}
        </nav>

        <p className="sidebar-footer">Inventory Management</p>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">INVENTORY MANAGEMENT</p>
            <h1>{activePage}</h1>
          </div>

          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <p>Administrator</p>
            </div>
          </div>
        </header>

        {activePage === 'Dashboard' && (
          <>
            <section className="welcome">
              <p className="eyebrow">RINGKASAN BISNIS</p>
              <h2>Selamat datang di SmartStock!</h2>
              <p>Pantau stok dan aktivitas penjualan bisnismu di sini.</p>
            </section>

            <section className="stats">
              <article className="stat-card">
                <p>Total Produk</p>
                <h2>{products.length}</h2>
                <span>Jenis produk terdaftar</span>
              </article>

              <article className="stat-card">
                <p>Total Transaksi</p>
                <h2>{transactions.length}</h2>
                <span>Transaksi penjualan berhasil</span>
              </article>

              <article className="stat-card">
                <p>Total Pendapatan</p>
                <h2>{formatRupiah(totalRevenue)}</h2>
                <span>Total nilai penjualan</span>
              </article>

              <article className="stat-card">
                <p>Total Pendapatan</p>
                <h2>{formatRupiah(0)}</h2>
                <span>Total penjualan</span>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Ringkasan Produk</h2>
                <p>Produk yang saat ini terdaftar di SmartStock.</p>
              </div>

              <div className="product-preview">
                {products.length === 0 ? (
                  <p>Belum ada produk. Tambahkan produk pertamamu!</p>
                ) : (
                  products.slice(0, 3).map((product) => (
                    <div className="preview-item" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.category}</p>
                      </div>
                      <span>{product.stock} unit</span>
                    </div>
                  ))
                )}
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() => setActivePage('Produk')}
              >
                Lihat Semua Produk
              </button>
            </section>
          </>
        )}

        {activePage === 'Produk' && (
          <section className="panel">
            <div className="product-toolbar">
              <div>
                <h2>Daftar Produk</h2>
                <p>Kelola informasi produk dan persediaan barang.</p>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Batal' : '+ Tambah Produk'}
              </button>
            </div>

            {showForm && (
              <form className="product-form" onSubmit={handleAddProduct}>
                <div className="form-group">
                  <label htmlFor="name">Nama Produk</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Pensil 2B"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Kategori</label>
                  <input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Contoh: Alat Tulis"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Jumlah Stok</label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Harga Satuan (Rp)</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="5000"
                    required
                  />
                </div>

                <button className="primary-button" type="submit">
                  Simpan Produk
                </button>
              </form>
            )}

            <input
              className="search-input"
              type="search"
              placeholder="Cari nama produk..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Stok</th>
                    <th>Harga</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>
                        <span
                          className={
                            product.stock <= 5
                              ? 'stock-badge low-stock'
                              : 'stock-badge'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>{formatRupiah(product.price)}</td>
                      <td>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">
                        Produk tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="product-count">
              Menampilkan {filteredProducts.length} dari {products.length} produk
            </p>
          </section>
        )}

        {activePage === 'Stok Barang' && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Manajemen Stok</h2>
              <p>Kelola persediaan barang yang tersedia.</p>
            </div>

            <div className="table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.stock} unit</td>

                      <td>
                        <span
                          className={
                            product.stock <= 5
                              ? 'stock-badge low-stock'
                              : 'stock-badge'
                          }
                        >
                          {product.stock <= 5
                            ? 'Stok Menipis'
                            : 'Stok Aman'}
                        </span>
                      </td>

                      <td>
                        <div className="stock-actions">
                          <button
                            className="secondary-button stock-button"
                            type="button"
                            onClick={() =>
                              handleUpdateStock(product.id, -1)
                            }
                            disabled={product.stock === 0}
                          >
                            −
                          </button>

                          <button
                            className="primary-button stock-button"
                            type="button"
                            onClick={() =>
                              handleUpdateStock(product.id, 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-data">
                        Belum ada produk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="product-count">
              Total {products.length} jenis produk
            </p>
          </section>
        )}

        {activePage === 'Transaksi' && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <h2>Buat Transaksi</h2>
                <p>Pilih produk dan masukkan jumlah yang terjual.</p>
              </div>

              <form
                className="product-form"
                onSubmit={handleTransactionSubmit}
              >
                <div className="form-group">
                  <label htmlFor="transaction-product">Produk</label>
                  <select
                    id="transaction-product"
                    value={transactionForm.productId}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        productId: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Pilih produk</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatRupiah(product.price)} (Stok: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-quantity">
                    Jumlah Terjual
                  </label>
                  <input
                    id="transaction-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={transactionForm.quantity}
                    onChange={(event) =>
                      setTransactionForm({
                        ...transactionForm,
                        quantity: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={products.length === 0}
                >
                  Simpan Transaksi
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Riwayat Transaksi</h2>
                <p>Daftar transaksi penjualan yang sudah dicatat.</p>
              </div>

              <div className="table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Harga Satuan</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.productName}</td>
                        <td>{transaction.quantity} unit</td>
                        <td>{formatRupiah(transaction.price)}</td>
                        <td>{formatRupiah(transaction.total)}</td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Belum ada transaksi penjualan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="product-count">
                Total {transactions.length} transaksi
              </p>
            </section>
          </>
        )}

        {activePage === 'Laporan' && (
          <>
            <section className="stats">
              <article className="stat-card">
                <p>Total Pendapatan</p>
                <h2>{formatRupiah(totalRevenue)}</h2>
                <span>Dari seluruh transaksi</span>
              </article>

              <article className="stat-card">
                <p>Total Transaksi</p>
                <h2>{transactions.length}</h2>
                <span>Transaksi berhasil dicatat</span>
              </article>

              <article className="stat-card">
                <p>Unit Terjual</p>
                <h2>{totalItemsSold}</h2>
                <span>Total barang terjual</span>
              </article>

              <article className="stat-card">
                <p>Produk Terlaris</p>
                <h2>
                  {bestSellingProduct
                    ? bestSellingProduct.name
                    : '-'}
                </h2>
                <span>
                  {bestSellingProduct
                    ? `${bestSellingProduct.sold} unit terjual`
                    : 'Belum ada penjualan'}
                </span>
              </article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Riwayat Penjualan</h2>
                <p>Ringkasan semua transaksi yang telah dicatat.</p>
              </div>

              <div className="table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Harga Satuan</th>
                      <th>Total Penjualan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.productName}</td>
                        <td>{transaction.quantity} unit</td>
                        <td>{formatRupiah(transaction.price)}</td>
                        <td>{formatRupiah(transaction.total)}</td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Belum ada data penjualan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activePage !== 'Dashboard' &&
          activePage !== 'Produk' &&
          activePage !== 'Stok Barang' &&
          activePage !== 'Transaksi' &&
          activePage !== 'Laporan' && (
            <section className="panel">
              <h2>{activePage}</h2>
              <p>
                Fitur {activePage} akan kita bangun pada tahap berikutnya.
              </p>
            </section>
          )}
      </main>
    </div>

  )
}

export default App
