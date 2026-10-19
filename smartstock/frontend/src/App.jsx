import { useEffect, useState } from 'react'
import './App.css'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, } from 'recharts'
import { LayoutDashboard, Package, Boxes, ShoppingCart, FileText, LogOut, } from 'lucide-react'
import Login from './login'
import { apiFetch } from './api'

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatTransactionDate(createdAt) {
  const date = new Date(createdAt)

  return {
    date: date.toLocaleString('id-ID'),
    dateKey: formatDateKey(date),
    hour: date.getHours(),
  }
}

function App() {
  const [authStatus, setAuthStatus] = useState('checking')
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activePage, setActivePage] = useState('Dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [cart, setCart] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [receiptTransaction, setReceiptTransaction] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('all')
  const [reportSelectedDate, setReportSelectedDate] = useState(() => {
    return formatDateKey(new Date())
  })
  const [reportSelectedWeekDate, setReportSelectedWeekDate] = useState(() =>
    formatDateKey(new Date())
  )

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const response = await apiFetch('/api/user')

        if (!response.ok) {
          if (!cancelled) {
            setUser(null)
            setAuthStatus('login')
          }
          return
        }

        const currentUser = await response.json()

        if (!cancelled) {
          setUser(currentUser)
          setAuthStatus('authenticated')
        }
      } catch (error) {
        console.error('Gagal memeriksa sesi:', error)

        if (!cancelled) {
          setAuthStatus('error')
        }
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await apiFetch('/api/products')

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

    if (authStatus === 'authenticated') {
      fetchProducts()
    } else if (authStatus === 'login') {
      setLoadingProducts(false)
    }
  }, [authStatus])

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await apiFetch('/api/transactions')

        if (!response.ok) {
          throw new Error('Gagal mengambil riwayat transaksi.')
        }

        const data = await response.json()

        const formattedTransactions = data.map((transaction) => ({
          id: transaction.id,
          total: Number(transaction.total),
          ...formatTransactionDate(transaction.created_at),

          items: transaction.details.map((detail) => ({
            productId: detail.product_id,
            productName:
              detail.product?.name || 'Produk tidak ditemukan',
            quantity: Number(detail.quantity),
            price: Number(detail.price),
            subtotal: Number(detail.subtotal),
          })),
        }))

        setTransactions(formattedTransactions)
      } catch (error) {
        console.error(error)
        alert(error.message || 'Gagal memuat riwayat transaksi.')
      }
    }

    if (authStatus === 'authenticated') {
      fetchTransactions()
    }
  }, [authStatus])

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

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  )

  const totalStockValue = products.reduce(
    (total, product) =>
      total + Number(product.price) * Number(product.stock),
    0
  )

  const totalRevenue = transactions.reduce(
    (total, transaction) => total + Number(transaction.total),
    0
  )

  const salesChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')

    const revenue = transactions
      .filter((transaction) => transaction.dateKey === dateKey)
      .reduce((total, transaction) => total + Number(transaction.total), 0)

    return {
      tanggal: date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      pendapatan: revenue,
    }
  })

  const reportToday = new Date()
  reportToday.setHours(0, 0, 0, 0)

  const reportStart = new Date(reportToday)
  const reportEnd = new Date(reportToday)

  if (
    reportPeriod === 'week' ||
    reportPeriod === 'week-date'
  ) {
    const weekAnchor = reportPeriod === 'week-date'
      ? new Date(`${reportSelectedWeekDate}T00:00:00`)
      : new Date(reportToday)

    reportStart.setTime(weekAnchor.getTime())
    reportStart.setDate(
      reportStart.getDate() - ((reportStart.getDay() + 6) % 7)
    )
    reportEnd.setTime(reportStart.getTime())
    reportEnd.setDate(reportEnd.getDate() + 6)
  }

  if (reportPeriod === 'date') {
    const selectedDate = new Date(`${reportSelectedDate}T00:00:00`)
    reportStart.setTime(selectedDate.getTime())
    reportEnd.setTime(selectedDate.getTime())
  } else if (reportPeriod === 'month') {
    reportStart.setDate(1)
    reportEnd.setMonth(reportEnd.getMonth() + 1, 0)
  } else if (reportPeriod === 'year') {
    reportStart.setMonth(0, 1)
    reportEnd.setMonth(11, 31)
  }

  const reportTransactions = transactions.filter((transaction) => {
    if (reportPeriod === 'all') return true

    return (
      transaction.dateKey >= formatDateKey(reportStart) &&
      transaction.dateKey <= formatDateKey(reportEnd)
    )
  })

  const reportRevenue = reportTransactions.reduce(
    (total, transaction) => total + Number(transaction.total),
    0
  )

  const reportItemsSold = reportTransactions.reduce(
    (total, transaction) =>
      total +
      transaction.items.reduce(
        (itemTotal, item) => itemTotal + Number(item.quantity),
        0
      ),
    0
  )

  const reportProductSales = reportTransactions.reduce((sales, transaction) => {
    transaction.items.forEach((item) => {
      sales[item.productId] =
        (sales[item.productId] || 0) + Number(item.quantity)
    })

    return sales
  }, {})

  const reportBestSellingProduct = products
    .map((product) => ({
      ...product,
      sold: reportProductSales[product.id] || 0,
    }))
    .filter((product) => product.sold > 0)
    .sort((a, b) => b.sold - a.sold)[0] || null

  let reportChartDates = []
  let reportChartGrouping = 'day'

  if (reportPeriod === 'today') {
    reportChartGrouping = 'hour'
    reportChartDates = Array.from({ length: 24 }, (_, hour) => hour)
  } else if (reportPeriod === 'date') {
    reportChartGrouping = 'hour'
    reportChartDates = Array.from({ length: 24 }, (_, hour) => hour)
  } else if (
    reportPeriod === 'week' ||
    reportPeriod === 'week-date'
  ) {
    reportChartDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(reportStart)
      date.setDate(date.getDate() + index)
      return date
    })
  } else if (reportPeriod === 'month') {
    const daysInMonth = new Date(
      reportToday.getFullYear(),
      reportToday.getMonth() + 1,
      0
    ).getDate()

    reportChartDates = Array.from({ length: daysInMonth }, (_, index) => {
      return new Date(reportToday.getFullYear(), reportToday.getMonth(), index + 1)
    })
  } else if (reportPeriod === 'year') {
    reportChartGrouping = 'month'
    reportChartDates = Array.from({ length: 12 }, (_, index) => {
      return new Date(reportToday.getFullYear(), index, 1)
    })
  } else if (reportTransactions.length > 0) {
    reportChartGrouping = 'month'
    const transactionDates = reportTransactions
      .map((transaction) => transaction.dateKey)
      .sort()
    const firstTransactionDate = new Date(`${transactionDates[0]}T00:00:00`)
    const lastTransactionDate = new Date(
      `${transactionDates[transactionDates.length - 1]}T00:00:00`
    )
    const firstMonth = new Date(
      firstTransactionDate.getFullYear(),
      firstTransactionDate.getMonth(),
      1
    )
    const lastMonth = new Date(
      lastTransactionDate.getFullYear(),
      lastTransactionDate.getMonth(),
      1
    )

    while (firstMonth <= lastMonth) {
      reportChartDates.push(new Date(firstMonth))
      firstMonth.setMonth(firstMonth.getMonth() + 1)
    }
  }

  const reportChartData = reportChartGrouping === 'hour'
    ? reportChartDates.map((hour) => ({
        tanggal: `${String(hour).padStart(2, '0')}:00`,
        pendapatan: reportTransactions
          .filter((transaction) => transaction.hour === hour)
          .reduce((total, transaction) => total + Number(transaction.total), 0),
      }))
    : reportChartDates.map((date) => {
        const bucketKey =
          reportChartGrouping === 'month'
            ? formatDateKey(date).slice(0, 7)
            : formatDateKey(date)
        const revenue = reportTransactions
          .filter((transaction) =>
            reportChartGrouping === 'month'
              ? transaction.dateKey.startsWith(bucketKey)
              : transaction.dateKey === bucketKey
          )
          .reduce((total, transaction) => total + Number(transaction.total), 0)

        return {
          tanggal:
            reportPeriod === 'date'
              ? date.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : reportChartGrouping === 'month'
                ? date.toLocaleDateString('id-ID', {
                    month: 'short',
                    year: 'numeric',
                  })
                : date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                  }),
          pendapatan: revenue,
        }
      })

  async function handleAddProduct(event) {
    event.preventDefault()

    const updatedData = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      stock: Number(formData.stock),
      price: Number(formData.price),
    }

    if (
      !updatedData.name ||
      !updatedData.category ||
      formData.stock === '' ||
      formData.price === '' ||
      !Number.isInteger(updatedData.stock) ||
      updatedData.stock < 0 ||
      !Number.isFinite(updatedData.price) ||
      updatedData.price < 0
    ) {
      alert('Lengkapi semua data dengan benar.')
      return
    }

    const isEditing = editingProduct !== null

    try {
      const response = await apiFetch(
        isEditing
          ? `/api/products/${editingProduct.id}`
          : '/api/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(updatedData),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          Object.values(data.errors || {}).flat().join('\n') ||
          data.message ||
          'Gagal menyimpan produk.'
        )
      }

      if (isEditing) {
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === data.id ? data : product
          )
        )

        alert('Produk berhasil diperbarui!')
      } else {
        setProducts((currentProducts) => [
          data,
          ...currentProducts,
        ])

        alert('Produk berhasil disimpan ke database!')
      }

      setFormData({
        name: '',
        category: '',
        stock: '',
        price: '',
      })

      setEditingProduct(null)
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert(
        error.message ||
        'Tidak dapat terhubung ke server Laravel.'
      )
    }
  }

  function handleEditProduct(product) {
    setEditingProduct(product)

    setFormData({
      name: product.name,
      category: product.category,
      stock: String(product.stock),
      price: String(product.price),
    })

    setShowForm(true)
  }

  async function handleDeleteProduct(id) {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus produk ini?'
    )

    if (!confirmed) return

    try {
      const response = await apiFetch(
        `/api/products/${id}`,
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


  async function handleUpdateStock(id, amount) {
    const product = products.find(
      (product) => product.id === id
    )

    if (!product) return

    const newStock = product.stock + amount

    if (newStock < 0) {
      alert('Stok tidak boleh kurang dari 0.')
      return
    }

    try {
      const response = await apiFetch(
        `/api/products/${id}/stock`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            stock: newStock,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))

        throw new Error(
          data.message || 'Gagal memperbarui stok.'
        )
      }

      const updatedProduct = await response.json()

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === id
            ? updatedProduct
            : product
        )
      )
    } catch (error) {
      console.error(error)
      alert(error.message || 'Gagal terhubung ke server Laravel.')
    }
  }

  async function handleLogout() {
    try {
      const response = await apiFetch('/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Gagal logout.')
      }

      setUser(null)
      setAuthStatus('login')
      setShowProfileMenu(false)
    } catch (error) {
      console.error('Gagal logout:', error)
      alert(error.message || 'Tidak dapat terhubung ke server.')
    }
  }


  async function handleTransactionSubmit(event) {
    event.preventDefault()

    if (cart.length === 0) {
      alert('Keranjang masih kosong.')
      return
    }

    // Validasi stok terbaru berdasarkan data frontend.
    for (const item of cart) {
      const product = products.find(
        (product) => product.id === item.id
      )

      if (!product) {
        alert(`Produk ${item.name} tidak ditemukan.`)
        return
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        alert(`Jumlah ${item.name} tidak valid.`)
        return
      }

      if (item.quantity > product.stock) {
        alert(`Stok ${item.name} tidak mencukupi.`)
        return
      }
    }

    try {
      const response = await apiFetch(
        '/api/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          Object.values(data.errors || {}).flat().join('\n') ||
          data.message ||
          'Gagal menyimpan transaksi.'
        )
      }

      // Perbarui stok berdasarkan hasil dari Laravel.
      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          const updatedProduct = data.details.find(
            (detail) => detail.product_id === product.id
          )

          if (!updatedProduct) return product

          return {
            ...product,
            stock: product.stock - updatedProduct.quantity,
          }
        })
      )

      // Simpan satu objek untuk seluruh transaksi.
      const newTransaction = {
        id: data.id,
        total: Number(data.total),
        ...formatTransactionDate(data.created_at),

        items: data.details.map((detail) => ({
          productId: detail.product_id,
          productName:
            detail.product?.name || 'Produk tidak ditemukan',
          quantity: Number(detail.quantity),
          price: Number(detail.price),
          subtotal: Number(detail.subtotal),
        })),
      }

      setTransactions((currentTransactions) => [
        newTransaction,
        ...currentTransactions,
      ])

      setCart([])
      setProductSearch('')

      // Tampilkan nota setelah transaksi berhasil disimpan
      setReceiptTransaction(newTransaction)
    } catch (error) {
      console.error(error)
      alert(
        error.message ||
        'Tidak dapat terhubung ke server Laravel.'
      )
    }
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      alert('Stok produk habis.')
      return
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      )

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert('Jumlah melebihi stok yang tersedia.')
          return currentCart
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          quantity: 1,
        },
      ]
    })
  }

  function updateCartQuantity(productId, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) return item

          const newQuantity = item.quantity + change

          if (newQuantity < 1 || newQuantity > item.stock) {
            return item
          }

          return { ...item, quantity: newQuantity }
        })
    )
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    )
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )
  const transactionProducts = filteredProducts.slice(0, 10)

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (authStatus === 'checking') {
    return <div className="auth-loading">Memeriksa sesi login...</div>
  }

  if (authStatus === 'error') {
    return (
      <div className="auth-loading">
        <p>Server tidak dapat dihubungi.</p>
        <button onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    )
  }

  if (authStatus === 'login') {
    return (
      <Login
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser)
          setAuthStatus('authenticated')
        }}
      />
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">SmartStock</h2>

        <nav>
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Produk', icon: Package },
            { name: 'Stok Barang', icon: Boxes },
            { name: 'Transaksi', icon: ShoppingCart },
            { name: 'Laporan', icon: FileText },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={`nav-link ${activePage === name ? 'active' : ''}`}
              onClick={() => setActivePage(name)}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <p className="sidebar-footer">Inventory Management</p>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">INVENTORY MANAGEMENT</p>
            <h1>{activePage}</h1>
          </div>

          <div className="profile-container">
            <button
              type="button"
              className="profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-expanded={showProfileMenu}
              aria-label="Buka menu profil"
            >
              <div className="avatar">A</div>
              <div className="profile-info">
                <strong>Admin</strong>
                <p>Administrator</p>
              </div>
              <span className="profile-chevron">
                {showProfileMenu ? '▲' : '▼'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  <strong>Admin SmartStock</strong>
                  <span>Administrator</span>
                </div>

                <button
                  type="button"
                  className="profile-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </div>
            )}
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
                <p>Total Nilai Stok</p>
                <h2>{formatRupiah(totalStockValue)}</h2>
                <span>Nilai barang yang tersedia</span>
              </article>
            </section>

            <section className="panel sales-chart-panel">
              <div className="panel-heading">
                <h2>Grafik Penjualan</h2>
                <p>Pendapatan selama 7 hari terakhir.</p>
              </div>

              <div className="sales-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={salesChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                      dataKey="tanggal"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `Rp${(value / 1000000).toLocaleString('id-ID')} jt`
                        }

                        if (value >= 1000) {
                          return `Rp${(value / 1000).toLocaleString('id-ID')} rb`
                        }

                        return `Rp${value}`
                      }}
                      tick={{ fontSize: 12 }}
                      width={75}
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatRupiah(Number(value)),
                        'Pendapatan',
                      ]}
                    />

                    <Bar
                      dataKey="pendapatan"
                      name="Pendapatan"
                      fill="#2563eb"
                      minPointSize={2}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                  products.slice(0, 5).map((product) => (
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
                  {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
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
                        <div className="product-actions">
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Hapus
                          </button>
                        </div>
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

            <section className="panel pos-panel">
              <div className="panel-heading">
                <h2>Kasir SmartStock</h2>
                <p>Pilih produk untuk menambahkannya ke keranjang.</p>
              </div>

              <div className="pos-layout">
                <div className="pos-products">
                  <div className="form-group">
                    <label htmlFor="product-search">Cari Produk</label>
                    <input
                      id="product-search"
                      type="search"
                      placeholder="Cari nama produk..."
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                    />
                  </div>

                  <div className="pos-product-grid">
                    {transactionProducts.map((product) => (
                      <button
                        type="button"
                        className="pos-product-card"
                        key={product.id}
                        disabled={Number(product.stock) <= 0}
                        onClick={() => addToCart(product)}
                      >
                        <span className="pos-product-icon">▦</span>
                        <strong>{product.name}</strong>
                        <span className="pos-product-category">
                          {product.category}
                        </span>
                        <strong className="pos-product-price">
                          {formatRupiah(Number(product.price))}
                        </strong>
                        <span className="pos-product-stock">
                          Stok: {product.stock} unit
                        </span>
                        <span className="pos-add-label">
                          {Number(product.stock) <= 0 ? 'Stok Habis' : '+ Tambah'}
                        </span>
                      </button>
                    ))}

                    {filteredProducts.length === 0 && (
                      <p className="no-data">Produk tidak ditemukan.</p>
                    )}
                  </div>
                  {filteredProducts.length > transactionProducts.length && (
                    <p className="product-count">
                      Menampilkan {transactionProducts.length} dari {filteredProducts.length} produk. Gunakan pencarian untuk menemukan produk lainnya.
                    </p>
                  )}
                </div>

                <div className="pos-cart">
                  <div className="pos-cart-heading">
                    <h3>Keranjang Belanja</h3>
                    <span>{cart.length} produk</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="pos-empty-cart">
                      <p>Keranjang masih kosong.</p>
                      <span>Pilih produk untuk memulai transaksi.</span>
                    </div>
                  ) : (
                    <div className="pos-cart-list">
                      {cart.map((item) => (
                        <div className="pos-cart-item" key={item.id}>
                          <div className="pos-cart-item-info">
                            <strong>{item.name}</strong>
                            <span>{formatRupiah(item.price)} / unit</span>
                            <strong>
                              {formatRupiah(item.price * item.quantity)}
                            </strong>
                          </div>

                          <div className="pos-cart-actions">
                            <div className="pos-quantity-control">
                              <button
                                type="button"
                                aria-label={`Kurangi ${item.name}`}
                                onClick={() => updateCartQuantity(item.id, -1)}
                              >
                                −
                              </button>

                              <span>{item.quantity}</span>

                              <button
                                type="button"
                                aria-label={`Tambah ${item.name}`}
                                disabled={item.quantity >= item.stock}
                                onClick={() => updateCartQuantity(item.id, 1)}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              className="pos-remove-button"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pos-cart-summary">
                    <div>
                      <span>Total kuantitas</span>
                      <strong>{cartItemCount} unit</strong>
                    </div>

                    <div className="pos-total">
                      <span>Total Belanja</span>
                      <strong>{formatRupiah(cartTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      className="primary-button pos-confirm-button"
                      disabled={cart.length === 0}
                      onClick={handleTransactionSubmit}
                    >
                      Konfirmasi Transaksi
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <section>

              {receiptTransaction && (
                <div
                  className="receipt-modal-overlay"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      setReceiptTransaction(null)
                    }
                  }}
                >
                  <section
                    className="receipt-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="receipt-modal-title"
                  >
                    <div className="receipt-modal-header">
                      <h2 id="receipt-modal-title">Nota Transaksi</h2>

                      <button
                        type="button"
                        className="receipt-close-button"
                        onClick={() => setReceiptTransaction(null)}
                        aria-label="Tutup nota"
                      >
                        ×
                      </button>
                    </div>

                    <div className="receipt-success">
                      Transaksi berhasil disimpan!
                    </div>

                    <div className="receipt-meta">
                      <p>
                        <span>ID Transaksi</span>
                        <strong>TRX-{receiptTransaction.id}</strong>
                      </p>

                      <p>
                        <span>Waktu Transaksi</span>
                        <strong>{receiptTransaction.date}</strong>
                      </p>
                    </div>

                    <div className="receipt-items">
                      <div className="receipt-items-heading">
                        <span>Produk</span>
                        <span>Subtotal</span>
                      </div>

                      {receiptTransaction.items.map((item) => (
                        <div className="receipt-item" key={item.productId}>
                          <div>
                            <strong>{item.productName}</strong>
                            <span>
                              {item.quantity} × {formatRupiah(item.price)}
                            </span>
                          </div>

                          <strong>{formatRupiah(item.subtotal)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="receipt-total">
                      <span>Total Belanja</span>
                      <strong>{formatRupiah(receiptTransaction.total)}</strong>
                    </div>

                    <div className="receipt-modal-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => window.print()}
                      >
                        Cetak Nota
                      </button>

                      <button
                        type="button"
                        className="receipt-secondary-button"
                        onClick={() => setReceiptTransaction(null)}
                      >
                        Tutup
                      </button>
                    </div>
                  </section>
                </div>
              )}

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
                      <th>ID Transaksi</th>
                      <th>Waktu</th>
                      <th>Detail Produk</th>
                      <th>Total Kuantitas</th>
                      <th>Total Penjualan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>TRX-{transaction.id}</td>
                        <td>{transaction.date}</td>

                        <td>
                          {transaction.items.map((item) => (
                            <div key={item.productId}>
                              {item.productName} × {item.quantity}
                            </div>
                          ))}
                        </td>

                        <td>
                          {transaction.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                          )} unit
                        </td>

                        <td>{formatRupiah(transaction.total)}</td>

                        <td>
                          <button
                            type="button"
                            className="receipt-secondary-button"
                            onClick={() => setReceiptTransaction(transaction)}
                          >
                            Cetak Nota
                          </button>
                        </td>
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

        {activePage === 'Laporan' && (
          <>
            <section className="panel report-filter-panel">
              <label htmlFor="report-period">Periode laporan</label>
              <select
                id="report-period"
                value={reportPeriod}
                onChange={(event) => setReportPeriod(event.target.value)}
              >
                <option value="today">Hari ini</option>
                <option value="week">Minggu ini</option>
                <option value="week-date">Pilih minggu lain</option>
                <option value="month">Bulan ini</option>
                <option value="year">Tahun ini</option>
                <option value="date">Pilih tanggal sebelumnya</option>
                <option value="all">Semua transaksi</option>
              </select>
              {reportPeriod === 'date' && (
                <label className="report-date-filter" htmlFor="report-date">
                  <span>Pilih tanggal</span>
                  <input
                    id="report-date"
                    type="date"
                    value={reportSelectedDate}
                    max={formatDateKey(reportToday)}
                    onChange={(event) =>
                      setReportSelectedDate(
                        (currentDate) => event.target.value || currentDate
                      )
                    }
                  />
                </label>
              )}
              {reportPeriod === 'week-date' && (
                <label className="report-date-filter" htmlFor="report-week">
                  <span>Pilih tanggal dalam minggu</span>
                  <input
                    id="report-week"
                    type="date"
                    value={reportSelectedWeekDate}
                    max={formatDateKey(reportToday)}
                    onChange={(event) =>
                      setReportSelectedWeekDate(
                        (currentDate) => event.target.value || currentDate
                      )
                    }
                  />
                </label>
              )}
            </section>

            <section className="stats">
              <article className="stat-card">
                <p>Total Pendapatan</p>
                <h2>{formatRupiah(reportRevenue)}</h2>
                <span>Sesuai periode laporan</span>
              </article>

              <article className="stat-card">
                <p>Total Transaksi</p>
                <h2>{reportTransactions.length}</h2>
                <span>Transaksi berhasil dicatat</span>
              </article>

              <article className="stat-card">
                <p>Unit Terjual</p>
                <h2>{reportItemsSold}</h2>
                <span>Total barang terjual</span>
              </article>

              <article className="stat-card">
                <p>Produk Terlaris</p>
                <h2>
                  {reportBestSellingProduct
                    ? reportBestSellingProduct.name
                    : '-'}
                </h2>
                <span>
                  {reportBestSellingProduct
                    ? `${reportBestSellingProduct.sold} unit terjual`
                    : 'Belum ada penjualan pada periode ini'}
                </span>
              </article>
            </section>

            <section className="panel sales-chart-panel">
              <div className="panel-heading">
                <h2>Grafik Penjualan</h2>
                <p>
                  Pendapatan {reportPeriod === 'all'
                    ? 'dari semua transaksi.'
                    : reportPeriod === 'today'
                      ? 'hari ini.'
                      : reportPeriod === 'week'
                        ? 'minggu ini.'
                        : reportPeriod === 'week-date'
                          ? `minggu ${reportStart.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                            })}–${reportEnd.toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}.`
                          : reportPeriod === 'month'
                            ? 'bulan ini.'
                            : reportPeriod === 'year'
                              ? 'tahun ini.'
                              : `pada ${new Date(`${reportSelectedDate}T00:00:00`).toLocaleDateString('id-ID')}.`}
                </p>
              </div>

              <div className="sales-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={reportChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                      dataKey="tanggal"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `Rp${(value / 1000000).toLocaleString('id-ID')} jt`
                        }

                        if (value >= 1000) {
                          return `Rp${(value / 1000).toLocaleString('id-ID')} rb`
                        }

                        return `Rp${value}`
                      }}
                      tick={{ fontSize: 12 }}
                      width={75}
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatRupiah(Number(value)),
                        'Pendapatan',
                      ]}
                    />

                    <Bar
                      dataKey="pendapatan"
                      name="Pendapatan"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {receiptTransaction && (
              <div
                className="receipt-modal-overlay"
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    setReceiptTransaction(null)
                  }
                }}
              >
                <section
                  className="receipt-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="receipt-modal-title"
                >
                  <div className="receipt-modal-header">
                    <h2 id="receipt-modal-title">Nota Transaksi</h2>

                    <button
                      type="button"
                      className="receipt-close-button"
                      onClick={() => setReceiptTransaction(null)}
                      aria-label="Tutup nota"
                    >
                      ×
                    </button>
                  </div>

                  <div className="receipt-success">
                    Transaksi berhasil disimpan!
                  </div>

                  <div className="receipt-meta">
                    <p>
                      <span>ID Transaksi</span>
                      <strong>TRX-{receiptTransaction.id}</strong>
                    </p>

                    <p>
                      <span>Waktu Transaksi</span>
                      <strong>{receiptTransaction.date}</strong>
                    </p>
                  </div>

                  <div className="receipt-items">
                    <div className="receipt-items-heading">
                      <span>Produk</span>
                      <span>Subtotal</span>
                    </div>

                    {receiptTransaction.items.map((item) => (
                      <div className="receipt-item" key={item.productId}>
                        <div>
                          <strong>{item.productName}</strong>
                          <span>
                            {item.quantity} × {formatRupiah(item.price)}
                          </span>
                        </div>

                        <strong>{formatRupiah(item.subtotal)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="receipt-total">
                    <span>Total Belanja</span>
                    <strong>{formatRupiah(receiptTransaction.total)}</strong>
                  </div>

                  <div className="receipt-modal-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => window.print()}
                    >
                      Cetak Nota
                    </button>

                    <button
                      type="button"
                      className="receipt-secondary-button"
                      onClick={() => setReceiptTransaction(null)}
                    >
                      Tutup
                    </button>
                  </div>
                </section>
              </div>
            )}

            <section className="panel">
              <div className="panel-heading">
                <h2>Riwayat Penjualan</h2>
                <p>
                  Menampilkan {reportTransactions.length} transaksi sesuai periode laporan.
                </p>
              </div>

              <div className="table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Waktu</th>
                      <th>Detail Produk</th>
                      <th>Total Kuantitas</th>
                      <th>Total Penjualan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>TRX-{transaction.id}</td>
                        <td>{transaction.date}</td>

                        <td>
                          {transaction.items.map((item) => (
                            <div key={item.productId}>
                              {item.productName} × {item.quantity}
                            </div>
                          ))}
                        </td>

                        <td>
                          {transaction.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                          )} unit
                        </td>

                        <td>{formatRupiah(transaction.total)}</td>

                        <td>
                          <button
                            type="button"
                            className="receipt-secondary-button"
                            onClick={() => setReceiptTransaction(transaction)}
                          >
                            Cetak Nota
                          </button>
                        </td>
                      </tr>
                    ))}

                    {reportTransactions.length === 0 && (
                      <tr>
                        <td colSpan="6" className="no-data">
                          Tidak ada transaksi pada periode ini.
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
