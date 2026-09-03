import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Trash2,
  Star,
  UploadCloud,
  Eye,
  EyeOff,
  FolderOpen,
  Camera,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react'
import { portfolioApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { imageUrl } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'

export default function PortfolioManager() {
  const { showToast } = useToast()

  const [categories, setCategories] = useState(null)
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [shoots, setShoots] = useState(null)
  const [activeShootId, setActiveShootId] = useState(null)
  const [shootForm, setShootForm] = useState({
    title: '',
    description: '',
    location: '',
    shoot_date: ''
  })

  const [images, setImages] = useState(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)

  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Portfolio'
    loadCategories()
  }, [])

  function loadCategories() {
    portfolioApi
      .categories(true)
      .then((data) => {
        setCategories(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        setCategories([])
      })
  }

  function loadShoots() {
    if (!activeCategoryId) {
      setShoots([])
      return
    }

    setShoots(null)
    setActiveShootId(null)
    setImages(null)

    portfolioApi
      .allShoots()
      .then((all) => {
        const filtered = Array.isArray(all)
          ? all.filter(
              (s) =>
                Number(s.category_id) ===
                Number(activeCategoryId)
            )
          : []

        setShoots(filtered)
      })
      .catch(() => {
        setShoots([])
      })
  }

  useEffect(() => {
    if (activeCategoryId) {
      loadShoots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId])

  function loadImages() {
    if (!activeShootId) {
      setImages([])
      return
    }

    setImages(null)

    portfolioApi
      .imagesForShoot(activeShootId)
      .then((data) => {
        setImages(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        setImages([])
      })
  }

  useEffect(() => {
    if (activeShootId) {
      loadImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShootId])

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const addCategory = async (e) => {
    e.preventDefault()

    const name =
      newCategoryName.trim()

    if (!name) return

    try {
      const created =
        await portfolioApi.createCategory({
          name
        })

      setNewCategoryName('')

      await loadCategories()

      setActiveCategoryId(
        created.id
      )

      showToast('Category created.')
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  const toggleCategoryVisible =
    async (category) => {
      try {
        await portfolioApi.updateCategory({
          ...category,
          visible:
            category.visible
              ? 0
              : 1
        })

        loadCategories()
      } catch (err) {
        showToast(
          err.message,
          'error'
        )
      }
    }

  const renameCategory = async (
    category,
    name
  ) => {
    setCategories((current) =>
      current.map((item) =>
        item.id === category.id
          ? {
              ...item,
              name
            }
          : item
      )
    )

    try {
      await portfolioApi.updateCategory({
        ...category,
        name
      })
    } catch (err) {
      showToast(
        err.message,
        'error'
      )

      loadCategories()
    }
  }

  // ==========================================================
  // SHOOTS
  // ==========================================================

  const addShoot = async (e) => {
    e.preventDefault()

    if (
      !shootForm.title.trim() ||
      !activeCategoryId
    ) {
      return
    }

    try {
      const created =
        await portfolioApi.createShoot({
          ...shootForm,
          category_id:
            activeCategoryId
        })

      setShootForm({
        title: '',
        description: '',
        location: '',
        shoot_date: ''
      })

      await loadShoots()

      setActiveShootId(
        created.id
      )

      showToast('Shoot created.')
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  const toggleShootVisible =
    async (shoot) => {
      try {
        await portfolioApi.updateShoot({
          ...shoot,
          visible:
            shoot.visible
              ? 0
              : 1,
          category_id:
            shoot.category_id
        })

        loadShoots()
      } catch (err) {
        showToast(
          err.message,
          'error'
        )
      }
    }

  // ==========================================================
  // IMAGES
  // ==========================================================

  const handleFileSelect =
    async (e) => {
      const files = Array.from(
        e.target.files || []
      )

      if (
        !files.length ||
        !activeShootId
      ) {
        return
      }

      setUploading(true)

      try {
        for (
          const file of files
        ) {
          const formData =
            new FormData()

          formData.append(
            'image',
            file
          )

          formData.append(
            'shoot_id',
            activeShootId
          )

          await portfolioApi.uploadImage(
            formData
          )
        }

        showToast(
          `${files.length} image${
            files.length > 1
              ? 's'
              : ''
          } uploaded.`
        )

        loadImages()
        loadShoots()
      } catch (err) {
        showToast(
          err.message,
          'error'
        )
      } finally {
        setUploading(false)

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            ''
        }
      }
    }

  const setCover = async (
    image
  ) => {
    try {
      await portfolioApi.updateImage({
        id: image.id,
        is_cover: true
      })

      loadImages()
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    }
  }

  const toggleImageVisible =
    async (image) => {
      try {
        await portfolioApi.updateImage({
          ...image,
          visible:
            image.visible
              ? 0
              : 1
        })

        loadImages()
      } catch (err) {
        showToast(
          err.message,
          'error'
        )
      }
    }

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete =
    async () => {
      if (!confirmDelete) {
        return
      }

      try {
        if (
          confirmDelete.type ===
          'category'
        ) {
          await portfolioApi.deleteCategory(
            confirmDelete.id
          )

          if (
            activeCategoryId ===
            confirmDelete.id
          ) {
            setActiveCategoryId(null)
            setActiveShootId(null)
            setShoots(null)
            setImages(null)
          }

          loadCategories()
        }

        if (
          confirmDelete.type ===
          'shoot'
        ) {
          await portfolioApi.deleteShoot(
            confirmDelete.id
          )

          if (
            activeShootId ===
            confirmDelete.id
          ) {
            setActiveShootId(null)
            setImages(null)
          }

          loadShoots()
        }

        if (
          confirmDelete.type ===
          'image'
        ) {
          await portfolioApi.deleteImage(
            confirmDelete.id
          )

          loadImages()
          loadShoots()
        }

        showToast('Deleted.')
        setConfirmDelete(null)
      } catch (err) {
        showToast(
          err.message,
          'error'
        )
      }
    }

  const activeCategory =
    categories?.find(
      (category) =>
        category.id ===
        activeCategoryId
    )

  const activeShoot =
    shoots?.find(
      (shoot) =>
        shoot.id ===
        activeShootId
    )

  const visibleImageCount =
    images?.filter(
      (image) =>
        !!image.visible
    ).length || 0

  return (
    <>
      <style>{`

        /*
        ============================================================
        PORTFOLIO MANAGER
        ============================================================
        */

        .portfolio-admin {
          --portfolio-border:
            var(--c-hairline);

          --portfolio-muted:
            var(--c-gray);

          width: 100%;
        }

        /*
        ============================================================
        HEADER
        ============================================================
        */

        .portfolio-admin__header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 30px;

          margin-bottom: 28px;
        }

        .portfolio-admin__eyebrow {
          display: block;

          margin-bottom: 7px;

          color:
            var(--portfolio-muted);

          /*
            Typography intentionally inherited
            from your existing admin styles.
          */
        }

        .portfolio-admin__title {
          margin: 0;

          /*
            IMPORTANT:
            Do not define a font here.
            This allows AdminLayout's existing
            typography to remain in control.
          */
        }

        .portfolio-admin__stats {
          display: flex;
          align-items: center;

          gap: 24px;

          color:
            var(--portfolio-muted);
        }

        .portfolio-admin__stat strong {
          display: block;

          margin-bottom: 3px;

          color:
            var(--c-text);

          /*
            No custom font declaration.
            No custom letter spacing.
          */
        }

        /*
        ============================================================
        WORKSPACE
        ============================================================
        */

        .portfolio-admin__workspace {
          display: grid;

          grid-template-columns:
            230px
            300px
            minmax(0, 1fr);

          min-height: 650px;

          overflow: hidden;

          border:
            1px solid
            var(--portfolio-border);

          background:
            var(--c-bg, #fff);
        }

        /*
        ============================================================
        SIDEBARS
        ============================================================
        */

        .portfolio-admin__sidebar {
          min-width: 0;

          border-right:
            1px solid
            var(--portfolio-border);
        }

        .portfolio-admin__sidebar--shoots {
          background:
            rgba(
              0,
              0,
              0,
              0.015
            );
        }

        .portfolio-admin__sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          min-height: 58px;

          padding:
            0 16px;

          border-bottom:
            1px solid
            var(--portfolio-border);
        }

        .portfolio-admin__sidebar-title {
          margin: 0;

          /*
            Existing typography is inherited.
          */
        }

        .portfolio-admin__count {
          color:
            var(--portfolio-muted);
        }

        /*
        ============================================================
        CATEGORY LIST
        ============================================================
        */

        .portfolio-admin__list {
          padding: 8px;
        }

        .portfolio-admin__list-item {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: space-between;

          width: 100%;

          min-height: 48px;

          padding:
            8px 10px;

          margin-bottom: 2px;

          border: 0;

          background:
            transparent;

          color:
            var(--c-text);

          text-align: left;

          cursor: pointer;

          /*
            Only visual transitions.
          */

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .portfolio-admin__list-item:hover {
          background:
            rgba(
              0,
              0,
              0,
              0.035
            );
        }

        .portfolio-admin__list-item.active {
          background:
            var(--c-text);

          color:
            var(--c-bg, #fff);
        }

        .portfolio-admin__list-item-main {
          display: flex;
          align-items: center;

          min-width: 0;

          gap: 9px;
        }

        .portfolio-admin__list-item-icon {
          flex: 0 0 auto;
        }

        .portfolio-admin__list-item input {
          min-width: 0;

          width: 100%;

          border: 0;

          outline: 0;

          background:
            transparent;

          color:
            inherit;

          font: inherit;
        }

        /*
        ============================================================
        STATUS
        ============================================================
        */

        .portfolio-admin__status {
          display: inline-flex;

          align-items: center;

          flex: 0 0 auto;

          padding:
            3px 6px;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.3
            );

          /*
            No custom typography.
          */
        }

        .portfolio-admin__status--hidden {
          opacity: 0.7;
        }

        /*
        ============================================================
        ADD CATEGORY
        ============================================================
        */

        .portfolio-admin__add {
          display: flex;

          gap: 6px;

          padding:
            10px 8px 8px;
        }

        .portfolio-admin__add input {
          min-width: 0;

          flex: 1;

          height: 38px;

          padding:
            0 10px;

          border:
            1px solid
            var(--portfolio-border);

          background:
            transparent;

          color:
            var(--c-text);

          outline: none;

          font: inherit;
        }

        .portfolio-admin__add input:focus {
          border-color:
            var(--c-text);
        }

        /*
        ============================================================
        SHOOT LIST
        ============================================================
        */

        .portfolio-admin__shoot {
          display: flex;

          align-items: center;
          justify-content: space-between;

          width: 100%;

          gap: 12px;

          min-height: 58px;

          padding:
            10px 12px;

          border: 0;

          border-bottom:
            1px solid
            var(--portfolio-border);

          background:
            transparent;

          color:
            var(--c-text);

          text-align: left;

          cursor: pointer;

          transition:
            background 0.2s ease;
        }

        .portfolio-admin__shoot:hover {
          background:
            rgba(
              0,
              0,
              0,
              0.035
            );
        }

        .portfolio-admin__shoot.active {
          background:
            rgba(
              0,
              0,
              0,
              0.06
            );
        }

        .portfolio-admin__shoot-info {
          min-width: 0;
        }

        .portfolio-admin__shoot-title {
          display: block;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .portfolio-admin__shoot-meta {
          display: flex;

          align-items: center;

          gap: 8px;

          margin-top: 4px;

          color:
            var(--portfolio-muted);
        }

        /*
        ============================================================
        MAIN PANEL
        ============================================================
        */

        .portfolio-admin__main {
          min-width: 0;

          background:
            var(--c-bg, #fff);
        }

        .portfolio-admin__main-header {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          min-height: 58px;

          padding:
            0 20px;

          border-bottom:
            1px solid
            var(--portfolio-border);
        }

        .portfolio-admin__main-heading {
          min-width: 0;
        }

        .portfolio-admin__main-heading h2 {
          margin: 0;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .portfolio-admin__main-heading p {
          margin:
            4px 0 0;

          color:
            var(--portfolio-muted);
        }

        /*
        ============================================================
        MAIN CONTROLS
        ============================================================
        */

        .portfolio-admin__controls {
          display: flex;
          align-items: center;

          gap: 8px;

          flex: 0 0 auto;
        }

        .portfolio-admin__control-button {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 6px;

          min-height: 32px;

          padding:
            0 10px;

          border:
            1px solid
            var(--portfolio-border);

          background:
            transparent;

          color:
            var(--c-text);

          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .portfolio-admin__control-button:hover {
          background:
            rgba(
              0,
              0,
              0,
              0.04
            );

          border-color:
            var(--c-text);
        }

        .portfolio-admin__control-button--danger {
          color:
            #B3261E;

          border-color:
            rgba(
              179,
              38,
              30,
              0.3
            );
        }

        /*
        ============================================================
        TOOLBAR
        ============================================================
        */

        .portfolio-admin__toolbar {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 16px;

          padding:
            12px 20px;

          border-bottom:
            1px solid
            var(--portfolio-border);
        }

        .portfolio-admin__toolbar-note {
          color:
            var(--portfolio-muted);
        }

        /*
        ============================================================
        UPLOAD
        ============================================================
        */

        .portfolio-admin__upload {
          position: relative;

          display: flex;

          align-items: center;
          justify-content: center;

          min-height: 100px;

          margin:
            18px 20px;

          padding:
            20px;

          border:
            1px dashed
            var(--portfolio-border);

          background:
            rgba(
              0,
              0,
              0,
              0.012
            );

          color:
            var(--portfolio-muted);

          text-align: center;

          cursor: pointer;

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .portfolio-admin__upload:hover {
          border-color:
            var(--c-text);

          background:
            rgba(
              0,
              0,
              0,
              0.025
            );
        }

        .portfolio-admin__upload-icon {
          display: block;

          margin-bottom: 8px;

          color:
            var(--c-text);
        }

        .portfolio-admin__upload-title {
          color:
            var(--c-text);
        }

        .portfolio-admin__upload-subtitle {
          margin-top: 5px;

          color:
            var(--portfolio-muted);
        }

        /*
        ============================================================
        IMAGE GRID
        ============================================================
        */

        .portfolio-admin__images {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 1px;

          padding:
            0 20px 20px;
        }

        .portfolio-admin__image {
          position: relative;

          aspect-ratio:
            1 / 1;

          overflow: hidden;

          background:
            #f2f2f2;
        }

        .portfolio-admin__image img {
          display: block;

          width: 100%;
          height: 100%;

          object-fit: cover;

          transition:
            transform 0.45s ease,
            opacity 0.25s ease;
        }

        .portfolio-admin__image:hover img {
          transform:
            scale(1.025);
        }

        /*
        ============================================================
        IMAGE OVERLAY
        ============================================================
        */

        .portfolio-admin__image-overlay {
          position: absolute;

          inset: 0;

          display: flex;

          flex-direction: column;

          justify-content: space-between;

          padding: 10px;

          background:
            linear-gradient(
              to bottom,
              rgba(
                0,
                0,
                0,
                0.32
              ),
              transparent 30%,
              transparent 65%,
              rgba(
                0,
                0,
                0,
                0.64
              )
            );

          opacity: 0;

          transition:
            opacity 0.25s ease;
        }

        .portfolio-admin__image:hover
        .portfolio-admin__image-overlay {
          opacity: 1;
        }

        .portfolio-admin__image-cover {
          align-self: flex-start;

          display: inline-flex;

          align-items: center;

          gap: 5px;

          padding:
            5px 7px;

          background:
            rgba(
              255,
              255,
              255,
              0.92
            );

          color:
            #111;
        }

        .portfolio-admin__image-actions {
          display: flex;

          align-items: center;

          gap: 5px;
        }

        .portfolio-admin__image-action {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          min-width: 28px;
          min-height: 28px;

          padding:
            0 7px;

          border: 0;

          background:
            rgba(
              0,
              0,
              0,
              0.68
            );

          color: #fff;

          cursor: pointer;

          transition:
            background 0.2s ease;
        }

        .portfolio-admin__image-action:hover {
          background:
            rgba(
              0,
              0,
              0,
              0.88
            );
        }

        .portfolio-admin__image-action--danger {
          background:
            rgba(
              179,
              38,
              30,
              0.85
            );
        }

        /*
        ============================================================
        EMPTY / PLACEHOLDER
        ============================================================
        */

        .portfolio-admin__placeholder {
          min-height: 400px;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 40px;
        }

        .portfolio-admin__shoot-form {
          margin:
            12px 8px 8px;

          padding:
            14px;

          border:
            1px solid
            var(--portfolio-border);

          background:
            rgba(
              0,
              0,
              0,
              0.015
            );
        }

        .portfolio-admin__form-title {
          margin:
            0 0 12px;
        }

        .portfolio-admin__form {
          display: flex;

          flex-direction: column;

          gap: 7px;
        }

        .portfolio-admin__form input,
        .portfolio-admin__form textarea {
          width: 100%;

          padding:
            9px 10px;

          border:
            1px solid
            var(--portfolio-border);

          background:
            transparent;

          color:
            var(--c-text);

          outline: none;

          font: inherit;
        }

        .portfolio-admin__form textarea {
          min-height: 65px;

          resize: vertical;
        }

        .portfolio-admin__form input:focus,
        .portfolio-admin__form textarea:focus {
          border-color:
            var(--c-text);
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 1100px) {

          .portfolio-admin__workspace {
            grid-template-columns:
              200px
              260px
              minmax(0, 1fr);
          }

          .portfolio-admin__images {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

        }

        @media (max-width: 850px) {

          .portfolio-admin__workspace {
            grid-template-columns:
              190px
              minmax(0, 1fr);
          }

          .portfolio-admin__sidebar--shoots {
            grid-column: 1 / -1;

            border-right: 0;

            border-top:
              1px solid
              var(--portfolio-border);
          }

          .portfolio-admin__main {
            grid-column: 1 / -1;
          }

          .portfolio-admin__sidebar:first-child {
            grid-row: 1;
          }

          .portfolio-admin__sidebar--shoots {
            grid-row: 2;
          }

          .portfolio-admin__main {
            grid-row: 3;
          }

        }

        @media (max-width: 600px) {

          .portfolio-admin__header {
            align-items: flex-start;

            flex-direction: column;

            gap: 16px;
          }

          .portfolio-admin__stats {
            width: 100%;

            justify-content: space-between;
          }

          .portfolio-admin__workspace {
            display: flex;

            flex-direction: column;
          }

          .portfolio-admin__sidebar,
          .portfolio-admin__sidebar--shoots {
            border-right: 0;
          }

          .portfolio-admin__sidebar-header {
            min-height: 52px;
          }

          .portfolio-admin__list {
            display: flex;

            overflow-x: auto;

            gap: 4px;

            padding:
              8px;
          }

          .portfolio-admin__list-item {
            flex: 0 0 auto;

            width: auto;

            min-width: 120px;
          }

          .portfolio-admin__add {
            padding:
              8px;
          }

          .portfolio-admin__images {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            padding:
              0 10px 10px;
          }

          .portfolio-admin__upload {
            margin:
              12px 10px;
          }

          .portfolio-admin__main-header {
            padding:
              10px;
          }

          .portfolio-admin__toolbar {
            padding:
              10px;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .portfolio-admin__list-item,
          .portfolio-admin__control-button,
          .portfolio-admin__upload,
          .portfolio-admin__image img,
          .portfolio-admin__image-overlay {
            transition: none;
          }

        }

      `}</style>

      <div className="admin-content portfolio-admin">

        {/* =======================================================
            PAGE HEADER
        ======================================================= */}

        <header className="portfolio-admin__header">

          <div>
            <span className="portfolio-admin__eyebrow">
              Content Management
            </span>

            <h1 className="display">
              Portfolio
            </h1>
          </div>

          <div className="portfolio-admin__stats">

            <div className="portfolio-admin__stat">
              <strong>
                {categories?.length || 0}
              </strong>
              Categories
            </div>

            <div className="portfolio-admin__stat">
              <strong>
                {shoots?.length || 0}
              </strong>
              Shoots
            </div>

            <div className="portfolio-admin__stat">
              <strong>
                {visibleImageCount}
              </strong>
              Visible Photos
            </div>

          </div>

        </header>

        {/* =======================================================
            MAIN WORKSPACE
        ======================================================= */}

        <div className="portfolio-admin__workspace">

          {/* =====================================================
              CATEGORIES
          ===================================================== */}

          <aside className="portfolio-admin__sidebar">

            <div className="portfolio-admin__sidebar-header">

              <h2 className="portfolio-admin__sidebar-title">
                Categories
              </h2>

              <span className="portfolio-admin__count">
                {categories?.length || 0}
              </span>

            </div>

            {categories === null && (
              <div style={{ padding: 20 }}>
                <LoadingState label="Loading…" />
              </div>
            )}

            {categories &&
              categories.length === 0 && (
                <div style={{ padding: 20 }}>
                  <EmptyState
                    title="No categories yet."
                  />
                </div>
              )}

            {categories &&
              categories.length > 0 && (
                <div className="portfolio-admin__list">

                  {categories.map(
                    (category) => (
                      <button
                        key={category.id}
                        type="button"
                        className={`
                          portfolio-admin__list-item
                          ${
                            activeCategoryId ===
                            category.id
                              ? 'active'
                              : ''
                          }
                        `}
                        onClick={() =>
                          setActiveCategoryId(
                            category.id
                          )
                        }
                      >

                        <span className="portfolio-admin__list-item-main">

                          <FolderOpen
                            size={14}
                          />

                          <input
                            value={
                              category.name
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            onChange={(e) =>
                              renameCategory(
                                category,
                                e.target.value
                              )
                            }
                          />

                        </span>

                        {!category.visible && (
                          <span className="portfolio-admin__status portfolio-admin__status--hidden">
                            Hidden
                          </span>
                        )}

                        {activeCategoryId ===
                          category.id && (
                          <ChevronRight
                            size={14}
                          />
                        )}

                      </button>
                    )
                  )}

                </div>
              )}

            <form
              onSubmit={addCategory}
              className="portfolio-admin__add"
            >

              <input
                type="text"
                placeholder="New category"
                value={newCategoryName}
                onChange={(e) =>
                  setNewCategoryName(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                className="btn btn--sm btn--primary"
                title="Add category"
              >
                <Plus size={14} />
              </button>

            </form>

          </aside>

          {/* =====================================================
              SHOOTS
          ===================================================== */}

          <aside className="portfolio-admin__sidebar portfolio-admin__sidebar--shoots">

            <div className="portfolio-admin__sidebar-header">

              <h2 className="portfolio-admin__sidebar-title">
                {activeCategory
                  ? activeCategory.name
                  : 'Shoots'}
              </h2>

              <span className="portfolio-admin__count">
                {shoots?.length || 0}
              </span>

            </div>

            {!activeCategory && (
              <div
                className="portfolio-admin__placeholder"
                style={{
                  minHeight: 240
                }}
              >
                <p
                  style={{
                    color:
                      'var(--c-gray)',
                    margin: 0,
                    textAlign: 'center'
                  }}
                >
                  Select a category
                  to manage its
                  shoots.
                </p>
              </div>
            )}

            {activeCategory &&
              shoots === null && (
                <div style={{ padding: 20 }}>
                  <LoadingState label="Loading…" />
                </div>
              )}

            {activeCategory &&
              shoots &&
              shoots.length === 0 && (
                <div style={{ padding: 12 }}>
                  <EmptyState
                    title="No shoots yet."
                    body="Create the first shoot below."
                  />
                </div>
              )}

            {activeCategory &&
              shoots &&
              shoots.length > 0 && (
                <div>
                  {shoots.map(
                    (shoot) => (
                      <button
                        key={shoot.id}
                        type="button"
                        className={`
                          portfolio-admin__shoot
                          ${
                            activeShootId ===
                            shoot.id
                              ? 'active'
                              : ''
                          }
                        `}
                        onClick={() =>
                          setActiveShootId(
                            shoot.id
                          )
                        }
                      >

                        <span className="portfolio-admin__shoot-info">

                          <span className="portfolio-admin__shoot-title">
                            {shoot.title}
                          </span>

                          <span className="portfolio-admin__shoot-meta">
                            <Camera size={10} />

                            {shoot.image_count ||
                              0}{' '}
                            photos

                            {!shoot.visible && (
                              <>
                                <span>·</span>
                                Hidden
                              </>
                            )}

                          </span>

                        </span>

                        <ChevronRight
                          size={13}
                        />

                      </button>
                    )
                  )}
                </div>
              )}

            {activeCategory && (
              <div className="portfolio-admin__shoot-form">

                <h3 className="portfolio-admin__form-title">
                  New Shoot
                </h3>

                <form
                  onSubmit={addShoot}
                  className="portfolio-admin__form"
                >

                  <input
                    type="text"
                    placeholder="Shoot title"
                    required
                    value={
                      shootForm.title
                    }
                    onChange={(e) =>
                      setShootForm({
                        ...shootForm,
                        title:
                          e.target.value
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Location"
                    value={
                      shootForm.location
                    }
                    onChange={(e) =>
                      setShootForm({
                        ...shootForm,
                        location:
                          e.target.value
                      })
                    }
                  />

                  <input
                    type="date"
                    value={
                      shootForm.shoot_date
                    }
                    onChange={(e) =>
                      setShootForm({
                        ...shootForm,
                        shoot_date:
                          e.target.value
                      })
                    }
                  />

                  <textarea
                    placeholder="Description"
                    value={
                      shootForm.description
                    }
                    onChange={(e) =>
                      setShootForm({
                        ...shootForm,
                        description:
                          e.target.value
                      })
                    }
                  />

                  <button
                    type="submit"
                    className="btn btn--sm btn--primary"
                  >
                    <Plus size={13} />
                    Add Shoot
                  </button>

                </form>

              </div>
            )}

          </aside>

          {/* =====================================================
              PHOTO WORKSPACE
          ===================================================== */}

          <main className="portfolio-admin__main">

            {!activeShoot && (
              <div className="portfolio-admin__placeholder">

                <div
                  style={{
                    textAlign: 'center',
                    maxWidth: 360
                  }}
                >

                  <ImageIcon
                    size={30}
                    strokeWidth={1.2}
                    style={{
                      marginBottom: 12,
                      opacity: 0.5
                    }}
                  />

                  <h2
                    style={{
                      margin:
                        '0 0 8px'
                    }}
                  >
                    Select a shoot
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color:
                        'var(--c-gray)',
                      lineHeight: 1.6
                    }}
                  >
                    Choose a shoot from
                    the list to upload,
                    organize, and manage
                    its photographs.
                  </p>

                </div>

              </div>
            )}

            {activeShoot && (
              <>

                <div className="portfolio-admin__main-header">

                  <div className="portfolio-admin__main-heading">

                    <h2>
                      {activeShoot.title}
                    </h2>

                    <p>
                      {activeCategory?.name}

                      {activeShoot.location
                        ? ` · ${activeShoot.location}`
                        : ''}
                    </p>

                  </div>

                  <div className="portfolio-admin__controls">

                    <label
                      className="portfolio-admin__control-button"
                      title="Publish or hide shoot"
                    >

                      {activeShoot.visible ? (
                        <Eye size={13} />
                      ) : (
                        <EyeOff size={13} />
                      )}

                      <input
                        type="checkbox"
                        checked={
                          !!activeShoot.visible
                        }
                        onChange={() =>
                          toggleShootVisible(
                            activeShoot
                          )
                        }
                        style={{
                          display: 'none'
                        }}
                      />

                      <span
                        onClick={() =>
                          toggleShootVisible(
                            activeShoot
                          )
                        }
                      >
                        {activeShoot.visible
                          ? 'Published'
                          : 'Hidden'}
                      </span>

                    </label>

                    <button
                      type="button"
                      className="
                        portfolio-admin__control-button
                        portfolio-admin__control-button--danger
                      "
                      onClick={() =>
                        setConfirmDelete({
                          type: 'shoot',
                          id:
                            activeShoot.id,
                          label:
                            activeShoot.title
                        })
                      }
                    >
                      <Trash2
                        size={13}
                      />

                      Delete
                    </button>

                  </div>

                </div>

                <div className="portfolio-admin__toolbar">

                  <span className="portfolio-admin__toolbar-note">
                    {images === null
                      ? 'Loading photos…'
                      : `${images.length} photo${
                          images.length !==
                          1
                            ? 's'
                            : ''
                        } in this shoot`}
                  </span>

                  {images &&
                    images.length >
                      0 && (
                      <span className="portfolio-admin__toolbar-note">
                        {visibleImageCount}{' '}
                        visible
                      </span>
                    )}

                </div>

                <div
                  className="portfolio-admin__upload"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >

                  <div>

                    <UploadCloud
                      size={23}
                      className="portfolio-admin__upload-icon"
                    />

                    <div className="portfolio-admin__upload-title">
                      {uploading
                        ? 'Uploading…'
                        : 'Upload photographs'}
                    </div>

                    <div className="portfolio-admin__upload-subtitle">
                      JPG, PNG, WEBP ·
                      Multiple files
                      supported
                    </div>

                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="
                      image/jpeg,
                      image/png,
                      image/webp
                    "
                    multiple
                    hidden
                    onChange={
                      handleFileSelect
                    }
                  />

                </div>

                {images === null && (
                  <div
                    style={{
                      padding:
                        '30px 20px'
                    }}
                  >
                    <LoadingState
                      label="Loading photos…"
                    />
                  </div>
                )}

                {images &&
                  images.length === 0 && (
                    <div
                      style={{
                        padding:
                          '15px 20px 40px'
                      }}
                    >
                      <EmptyState
                        title="No photos yet."
                        body="Upload the first photograph above."
                      />
                    </div>
                  )}

                {images &&
                  images.length > 0 && (
                    <div className="portfolio-admin__images">

                      {images.map(
                        (image) => (
                          <article
                            className="portfolio-admin__image"
                            key={image.id}
                          >

                            <img
                              src={imageUrl(
                                image.image_path
                              )}
                              alt={
                                image.title ||
                                'Portfolio photograph'
                              }
                              style={{
                                opacity:
                                  image.visible
                                    ? 1
                                    : 0.35
                              }}
                            />

                            <div className="portfolio-admin__image-overlay">

                              {image.is_cover && (
                                <span className="portfolio-admin__image-cover">
                                  <Star
                                    size={10}
                                  />
                                  Cover
                                </span>
                              )}

                              <div />

                              <div className="portfolio-admin__image-actions">

                                <button
                                  type="button"
                                  className="portfolio-admin__image-action"
                                  onClick={() =>
                                    setCover(
                                      image
                                    )
                                  }
                                  title="Set as cover"
                                >
                                  <Star
                                    size={12}
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="portfolio-admin__image-action"
                                  onClick={() =>
                                    toggleImageVisible(
                                      image
                                    )
                                  }
                                  title={
                                    image.visible
                                      ? 'Hide photo'
                                      : 'Show photo'
                                  }
                                >
                                  {image.visible ? (
                                    <>
                                      <EyeOff
                                        size={
                                          12
                                        }
                                      />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye
                                        size={
                                          12
                                        }
                                      />
                                      Show
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className="
                                    portfolio-admin__image-action
                                    portfolio-admin__image-action--danger
                                  "
                                  onClick={() =>
                                    setConfirmDelete({
                                      type:
                                        'image',
                                      id:
                                        image.id,
                                      label:
                                        'this photo'
                                    })
                                  }
                                  title="Delete photo"
                                >
                                  <Trash2
                                    size={12}
                                  />
                                </button>

                              </div>

                            </div>

                          </article>
                        )
                      )}

                    </div>
                  )}

              </>
            )}

          </main>

        </div>

      </div>

      {confirmDelete && (
        <Modal
          title={`
            Delete ${
              confirmDelete.type ===
              'category'
                ? 'category'
                : confirmDelete.type ===
                  'shoot'
                ? 'shoot'
                : 'photo'
            } "${confirmDelete.label}"?
          `}
          body={
            confirmDelete.type !==
            'image'
              ? 'This will also delete everything inside it. This cannot be undone.'
              : 'This cannot be undone.'
          }
          confirmLabel="Delete"
          danger
          onConfirm={
            handleDelete
          }
          onClose={() =>
            setConfirmDelete(null)
          }
        />
      )}

    </>
  )
}