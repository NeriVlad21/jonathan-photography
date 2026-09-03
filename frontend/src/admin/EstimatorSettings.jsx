import { useEffect, useState } from 'react'
import {
  Trash2,
  Settings2,
  DollarSign,
  Clock3,
  PackagePlus,
  Percent,
  Eye,
  EyeOff,
  Plus,
  Save,
  Layers3
} from 'lucide-react'

import {
  estimatorApi,
  servicesApi
} from '../services/api.js'

import {
  useToast
} from '../context/ToastContext.jsx'

import LoadingState from '../components/LoadingState.jsx'
import Modal from '../components/Modal.jsx'

export default function EstimatorSettings() {
  const { showToast } = useToast()

  const [config, setConfig] =
    useState(null)

  const [newHour, setNewHour] =
    useState({
      label: '',
      hours: '',
      price: ''
    })

  const [newAddon, setNewAddon] =
    useState({
      label: '',
      description: '',
      price: '',
      is_quantity_based: 0
    })

  const [confirmDelete, setConfirmDelete] =
    useState(null)

  const [margin, setMargin] =
    useState(() =>
      localStorage.getItem(
        'estimator_margin'
      ) || '15'
    )

  const [savingMargin, setSavingMargin] =
    useState(false)

  /*
  ============================================================
  LOAD
  ============================================================
  */

  const load = () =>
    estimatorApi
      .config(true)
      .then((data) => {
        setConfig({
          hours:
            Array.isArray(data?.hours)
              ? data.hours
              : [],

          addons:
            Array.isArray(data?.addons)
              ? data.addons
              : [],

          services:
            Array.isArray(data?.services)
              ? data.services
              : []
        })
      })
      .catch(() => {
        setConfig({
          hours: [],
          addons: [],
          services: []
        })
      })

  useEffect(() => {
    document.title =
      'Admin — Estimator Settings'

    load()
  }, [])

  /*
  ============================================================
  GLOBAL MARGIN
  ============================================================
  */

  const saveMargin = (event) => {
    event.preventDefault()

    setSavingMargin(true)

    try {
      const value =
        Number(margin)

      if (
        Number.isNaN(value) ||
        value < 0 ||
        value > 100
      ) {
        showToast(
          'Margin must be between 0 and 100.',
          'error'
        )
        return
      }

      localStorage.setItem(
        'estimator_margin',
        String(value)
      )

      setMargin(String(value))

      showToast(
        'Estimator range margin updated.'
      )
    } finally {
      setSavingMargin(false)
    }
  }

  /*
  ============================================================
  SERVICE PRICING
  ============================================================
  */

  const updateServicePrice = async (
    service,
    value
  ) => {
    const price =
      value === ''
        ? ''
        : Number(value)

    const updated = {
      ...service,
      starting_price: price
    }

    setConfig((current) => ({
      ...current,
      services:
        current.services.map(
          (item) =>
            item.id === service.id
              ? updated
              : item
        )
    }))

    try {
      await servicesApi.update({
        id: service.id,
        name: service.name,
        category: service.category,
        description:
          service.description || '',
        starting_price:
          value === ''
            ? ''
            : Number(value),
        visible:
          service.visible ? 1 : 0,
        sort_order:
          Number(
            service.sort_order || 0
          )
      })

      showToast(
        `${service.name} price updated.`
      )
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update service price.',
        'error'
      )

      load()
    }
  }

  const updateServiceField = async (
    service,
    field,
    value
  ) => {
    const updated = {
      ...service,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      services:
        current.services.map(
          (item) =>
            item.id === service.id
              ? updated
              : item
        )
    }))

    try {
      await servicesApi.update({
        id: service.id,

        name:
          field === 'name'
            ? value
            : service.name,

        category:
          field === 'category'
            ? value
            : service.category,

        description:
          field === 'description'
            ? value
            : service.description || '',

        starting_price:
          field === 'starting_price'
            ? (
                value === ''
                  ? ''
                  : Number(value)
              )
            : Number(
                service.starting_price || 0
              ),

        visible:
          field === 'visible'
            ? (value ? 1 : 0)
            : (
                service.visible
                  ? 1
                  : 0
              ),

        sort_order:
          field === 'sort_order'
            ? Number(value || 0)
            : Number(
                service.sort_order || 0
              )
      })

      if (field === 'visible') {
        showToast(
          `${service.name} visibility updated.`
        )
      }
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update service.',
        'error'
      )

      load()
    }
  }

  /*
  ============================================================
  COVERAGE HOURS
  ============================================================
  */

  const addHour = async (event) => {
    event.preventDefault()

    try {
      await estimatorApi.createHour(
        newHour
      )

      setNewHour({
        label: '',
        hours: '',
        price: ''
      })

      showToast(
        'Coverage option added.'
      )

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to add coverage option.',
        'error'
      )
    }
  }

  const updateHourField = async (
    hour,
    field,
    value
  ) => {
    const updated = {
      ...hour,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      hours:
        current.hours.map(
          (item) =>
            item.id === hour.id
              ? updated
              : item
        )
    }))

    try {
      await estimatorApi.updateHour(
        updated
      )
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update coverage option.',
        'error'
      )

      load()
    }
  }

  /*
  ============================================================
  ADD-ONS
  ============================================================
  */

  const addAddon = async (event) => {
    event.preventDefault()

    try {
      await estimatorApi.createAddon(
        newAddon
      )

      setNewAddon({
        label: '',
        description: '',
        price: '',
        is_quantity_based: 0
      })

      showToast(
        'Add-on added.'
      )

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to add add-on.',
        'error'
      )
    }
  }

  const updateAddonField = async (
    addon,
    field,
    value
  ) => {
    const updated = {
      ...addon,
      [field]: value
    }

    setConfig((current) => ({
      ...current,
      addons:
        current.addons.map(
          (item) =>
            item.id === addon.id
              ? updated
              : item
        )
    }))

    try {
      await estimatorApi.updateAddon(
        updated
      )
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update add-on.',
        'error'
      )

      load()
    }
  }

  /*
  ============================================================
  DELETE
  ============================================================
  */

  const handleDelete = async () => {
    if (!confirmDelete) {
      return
    }

    try {
      if (
        confirmDelete.type ===
        'hour'
      ) {
        await estimatorApi.deleteHour(
          confirmDelete.id
        )
      } else {
        await estimatorApi.deleteAddon(
          confirmDelete.id
        )
      }

      showToast(
        `${confirmDelete.type === 'hour' ? 'Coverage option' : 'Add-on'} deleted.`
      )

      setConfirmDelete(null)

      load()
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to delete item.',
        'error'
      )
    }
  }

  /*
  ============================================================
  EMPTY STATE
  ============================================================
  */

  const renderEmpty = (
    icon,
    title,
    body
  ) => (
    <div className="estimator-settings-empty">

      <div className="estimator-settings-empty__icon">
        {icon}
      </div>

      <strong>
        {title}
      </strong>

      <span>
        {body}
      </span>

    </div>
  )

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (!config) {
    return (
      <LoadingState
        label="Loading estimator settings…"
      />
    )
  }

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /*
        ============================================================
        ESTIMATOR SETTINGS
        ============================================================
        */

        .estimator-settings-page {
          width: 100%;
        }

        .estimator-settings-content {
          width: 100%;

          max-width:
            1050px;
        }

        /*
        ============================================================
        INTRO
        ============================================================
        */

        .estimator-settings-intro {
          margin-bottom:
            20px;

          color:
            var(--c-gray);
        }

        .estimator-settings-intro p {
          margin:
            0;

          max-width:
            70ch;
        }

        /*
        ============================================================
        PANEL
        ============================================================
        */

        .estimator-settings-panel {
          margin-bottom:
            18px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);

          overflow:
            hidden;
        }

        .estimator-settings-panel:last-child {
          margin-bottom:
            0;
        }

        .estimator-settings-panel__head {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .estimator-settings-panel__title-wrap {
          display: flex;

          align-items: center;

          gap: 10px;
        }

        .estimator-settings-panel__icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width: 31px;
          height: 31px;

          flex:
            0 0 31px;

          border-radius:
            7px;

          background:
            #111;

          color:
            #fff;
        }

        .estimator-settings-panel__title {
          margin:
            0;
        }

        .estimator-settings-panel__description {
          margin:
            4px 0 0;

          color:
            var(--c-gray);
        }

        .estimator-settings-panel__body {
          padding:
            20px;
        }

        /*
        ============================================================
        GLOBAL MARGIN
        ============================================================
        */

        .estimator-margin-form {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 25px;
        }

        .estimator-margin-copy {
          min-width:
            0;
        }

        .estimator-margin-copy__label {
          display: block;

          margin-bottom:
            4px;
        }

        .estimator-margin-copy__text {
          margin:
            0;

          color:
            var(--c-gray);

          line-height:
            1.5;
        }

        .estimator-margin-control {
          display: flex;

          align-items: center;

          gap: 7px;

          flex:
            0 0 auto;
        }

        .estimator-margin-input {
          width:
            90px;

          min-height:
            42px;

          box-sizing:
            border-box;

          padding:
            0 11px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fafafa;

          color:
            var(--c-text);

          outline:
            none;

          font:
            inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .estimator-margin-input:hover {
          background:
            #fff;

          border-color:
            #c5c5c5;
        }

        .estimator-margin-input:focus {
          background:
            #fff;

          border-color:
            var(--c-text);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .estimator-margin-percent {
          color:
            var(--c-gray);
        }

        .estimator-margin-button {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          min-height:
            42px;
        }

        /*
        ============================================================
        SERVICE PRICING
        ============================================================
        */

        .estimator-service-list {
          display: flex;

          flex-direction:
            column;
        }

        .estimator-service-row {
          display: grid;

          grid-template-columns:
            minmax(180px, 1fr)
            190px
            72px;

          align-items: center;

          gap:
            15px;

          padding:
            15px 0;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);
        }

        .estimator-service-row:first-child {
          padding-top:
            0;
        }

        .estimator-service-row:last-child {
          padding-bottom:
            0;

          border-bottom:
            0;
        }

        .estimator-service-info {
          min-width:
            0;
        }

        .estimator-service-name {
          margin:
            0 0 3px;
        }

        .estimator-service-category {
          color:
            var(--c-gray);

          text-transform:
            capitalize;
        }

        .estimator-price-control {
          display: flex;

          align-items: center;

          gap: 7px;
        }

        .estimator-price-prefix {
          color:
            var(--c-gray);
        }

        .estimator-price-input {
          width:
            100%;

          min-height:
            39px;

          box-sizing:
            border-box;

          padding:
            0 10px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          outline:
            none;

          background:
            #fafafa;

          color:
            var(--c-text);

          font:
            inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .estimator-price-input:hover {
          background:
            #fff;

          border-color:
            #c5c5c5;
        }

        .estimator-price-input:focus {
          background:
            #fff;

          border-color:
            var(--c-text);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .estimator-visibility {
          display: flex;

          align-items: center;

          justify-content:
            flex-end;
        }

        .estimator-visibility__button {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          width:
            36px;

          height:
            36px;

          padding: 0;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fff;

          color:
            #777;

          cursor:
            pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .estimator-visibility__button:hover {
          background:
            #f4f4f4;

          color:
            var(--c-text);

          border-color:
            #c5c5c5;
        }

        .estimator-visibility__button--visible {
          color:
            #247447;
        }

        /*
        ============================================================
        ROW LISTS
        ============================================================
        */

        .estimator-list {
          display:
            flex;

          flex-direction:
            column;
        }

        .estimator-list-row {
          display:
            grid;

          grid-template-columns:
            minmax(130px, 1.2fr)
            90px
            120px
            80px
            40px;

          align-items:
            center;

          gap:
            10px;

          padding:
            13px 0;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);
        }

        .estimator-list-row:last-child {
          border-bottom:
            0;
        }

        .estimator-inline-input {
          width:
            100%;

          min-height:
            38px;

          box-sizing:
            border-box;

          padding:
            0 9px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fafafa;

          color:
            var(--c-text);

          outline:
            none;

          font:
            inherit;
        }

        .estimator-inline-input:focus {
          background:
            #fff;

          border-color:
            var(--c-text);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .estimator-active-control {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }

        .estimator-delete {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            34px;

          height:
            34px;

          padding:
            0;

          border:
            1px solid
            rgba(
              179,
              38,
              30,
              0.35
            );

          border-radius:
            7px;

          background:
            transparent;

          color:
            #b3261e;

          cursor:
            pointer;

          transition:
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .estimator-delete:hover {
          background:
            rgba(
              179,
              38,
              30,
              0.05
            );

          border-color:
            #b3261e;
        }

        /*
        ============================================================
        ADD ROW
        ============================================================
        */

        .estimator-add-row {
          display:
            grid;

          grid-template-columns:
            minmax(130px, 1.2fr)
            90px
            120px
            80px
            auto;

          align-items:
            center;

          gap:
            10px;

          margin-top:
            14px;

          padding-top:
            14px;

          border-top:
            1px dashed
            #dcdcdc;
        }

        .estimator-add-row__action {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          white-space:
            nowrap;
        }

        /*
        ============================================================
        ADD-ON LIST
        ============================================================
        */

        .estimator-addon-row {
          display:
            grid;

          grid-template-columns:
            minmax(140px, 1fr)
            minmax(180px, 1.4fr)
            100px
            95px
            75px
            40px;

          align-items:
            center;

          gap:
            10px;

          padding:
            13px 0;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);
        }

        .estimator-addon-row:last-child {
          border-bottom:
            0;
        }

        .estimator-addon-label {
          min-width:
            0;
        }

        .estimator-addon-description {
          min-width:
            0;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }

        .estimator-switch-field {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;
        }

        .estimator-switch-label {
          color:
            var(--c-gray);
        }

        /*
        ============================================================
        ADD-ON ADD FORM
        ============================================================
        */

        .estimator-addon-add-row {
          display:
            grid;

          grid-template-columns:
            minmax(140px, 1fr)
            minmax(180px, 1.4fr)
            100px
            95px
            auto;

          align-items:
            center;

          gap:
            10px;

          margin-top:
            14px;

          padding-top:
            14px;

          border-top:
            1px dashed
            #dcdcdc;
        }

        .estimator-addon-quantity {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          color:
            var(--c-gray);

          white-space:
            nowrap;
        }

        .estimator-addon-submit {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          white-space:
            nowrap;
        }

        /*
        ============================================================
        EMPTY
        ============================================================
        */

        .estimator-settings-empty {
          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          padding:
            35px 20px;

          color:
            var(--c-gray);

          text-align:
            center;
        }

        .estimator-settings-empty__icon {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            42px;

          height:
            42px;

          margin-bottom:
            10px;

          border-radius:
            50%;

          background:
            #f1f1f1;

          color:
            #777;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 900px) {

          .estimator-service-row {
            grid-template-columns:
              minmax(160px, 1fr)
              170px
              50px;
          }

          .estimator-addon-row {
            grid-template-columns:
              minmax(140px, 1fr)
              minmax(150px, 1fr)
              90px
              75px
              70px
              40px;
          }

          .estimator-addon-add-row {
            grid-template-columns:
              minmax(130px, 1fr)
              minmax(150px, 1fr)
              90px
              auto;
          }

          .estimator-addon-quantity {
            grid-column:
              1 / -1;
          }

        }

        @media (max-width: 760px) {

          .estimator-margin-form {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .estimator-margin-control {
            width:
              100%;
          }

          .estimator-margin-input {
            width:
              100%;
          }

          .estimator-margin-button {
            flex:
              0 0 auto;
          }

          .estimator-service-row {
            grid-template-columns:
              1fr;

            gap:
              10px;
          }

          .estimator-price-control {
            max-width:
              220px;
          }

          .estimator-visibility {
            justify-content:
              flex-start;
          }

          .estimator-list-row,
          .estimator-addon-row {
            display:
              flex;

            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              8px;

            padding:
              15px 0;
          }

          .estimator-list-row
          > *,
          .estimator-addon-row
          > * {
            width:
              100%;
          }

          .estimator-active-control,
          .estimator-switch-field {
            justify-content:
              flex-start;
          }

          .estimator-delete {
            width:
              100%;
          }

          .estimator-add-row,
          .estimator-addon-add-row {
            display:
              flex;

            flex-direction:
              column;

            align-items:
              stretch;

            gap:
              8px;
          }

          .estimator-add-row .btn,
          .estimator-addon-submit {
            width:
              100%;
          }

        }

        @media (max-width: 500px) {

          .estimator-settings-panel__head,
          .estimator-settings-panel__body {
            padding:
              15px;
          }

          .estimator-margin-control {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .estimator-margin-percent {
            display:
              none;
          }

          .estimator-price-control {
            max-width:
              none;
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

          .estimator-margin-input,
          .estimator-price-input,
          .estimator-inline-input,
          .estimator-visibility__button,
          .estimator-delete {
            transition:
              none;
          }

        }

      `}</style>

      <section className="estimator-settings-page">

        <div className="admin-content estimator-settings-content">

          {/* ====================================================
              INTRO
              ==================================================== */}

          <div className="estimator-settings-intro">
            <p>
              Configure service pricing, coverage
              hours, add-ons, and the pricing logic
              used by the public estimator.
            </p>
          </div>

          {/* ====================================================
              GLOBAL LOGIC
              ==================================================== */}

          <section className="estimator-settings-panel">

            <div className="estimator-settings-panel__head">

              <div className="estimator-settings-panel__title-wrap">

                <span className="estimator-settings-panel__icon">
                  <Percent size={15} />
                </span>

                <div>
                  <h2 className="estimator-settings-panel__title">
                    Global Logic
                  </h2>

                  <p className="estimator-settings-panel__description">
                    Control how the public estimator
                    displays its price range.
                  </p>
                </div>

              </div>

            </div>

            <div className="estimator-settings-panel__body">

              <form
                className="estimator-margin-form"
                onSubmit={saveMargin}
              >

                <div className="estimator-margin-copy">

                  <strong className="estimator-margin-copy__label">
                    Price Range Margin
                  </strong>

                  <p className="estimator-margin-copy__text">
                    The estimator uses this percentage
                    to calculate the displayed pricing
                    range.
                  </p>

                </div>

                <div className="estimator-margin-control">

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={margin}
                    onChange={(event) =>
                      setMargin(
                        event.target.value
                      )
                    }
                    className="estimator-margin-input"
                    aria-label="Price range margin percentage"
                  />

                  <span className="estimator-margin-percent">
                    %
                  </span>

                  <button
                    type="submit"
                    className="
                      btn
                      btn--primary
                      estimator-margin-button
                    "
                    disabled={savingMargin}
                  >
                    <Save size={14} />

                    {savingMargin
                      ? 'Saving…'
                      : 'Save Margin'}
                  </button>

                </div>

              </form>

            </div>

          </section>

          {/* ====================================================
              SERVICE PRICING
              ==================================================== */}

          <section className="estimator-settings-panel">

            <div className="estimator-settings-panel__head">

              <div className="estimator-settings-panel__title-wrap">

                <span className="estimator-settings-panel__icon">
                  <DollarSign size={15} />
                </span>

                <div>

                  <h2 className="estimator-settings-panel__title">
                    Service Type Pricing
                  </h2>

                  <p className="estimator-settings-panel__description">
                    Set the individual starting price
                    used by the public estimator.
                  </p>

                </div>

              </div>

            </div>

            <div className="estimator-settings-panel__body">

              {config.services.length === 0 ? (
                renderEmpty(
                  <Layers3 size={18} />,
                  'No services found.',
                  'Add services from the Services section.'
                )
              ) : (
                <div className="estimator-service-list">

                  {config.services.map(
                    (service) => (
                      <div
                        className="estimator-service-row"
                        key={service.id}
                      >

                        <div className="estimator-service-info">

                          <strong className="estimator-service-name">
                            {service.name}
                          </strong>

                          <div className="estimator-service-category">
                            {service.category ||
                              'Photography'}
                          </div>

                        </div>

                        <div className="estimator-price-control">

                          <span className="estimator-price-prefix">
                            ₱
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              service.starting_price ??
                              ''
                            }
                            onChange={(event) =>
                              updateServicePrice(
                                service,
                                event.target.value
                              )
                            }
                            className="estimator-price-input"
                            title="Starting price"
                          />

                        </div>

                        <div className="estimator-visibility">

                          <button
                            type="button"
                            className={`
                              estimator-visibility__button
                              ${
                                service.visible
                                  ? 'estimator-visibility__button--visible'
                                  : ''
                              }
                            `}
                            onClick={() =>
                              updateServiceField(
                                service,
                                'visible',
                                !service.visible
                              )
                            }
                            title={
                              service.visible
                                ? 'Visible on public estimator'
                                : 'Hidden from public estimator'
                            }
                            aria-label={
                              service.visible
                                ? `Hide ${service.name}`
                                : `Show ${service.name}`
                            }
                          >

                            {service.visible ? (
                              <Eye size={15} />
                            ) : (
                              <EyeOff size={15} />
                            )}

                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </section>

          {/* ====================================================
              COVERAGE HOURS
              ==================================================== */}

          <section className="estimator-settings-panel">

            <div className="estimator-settings-panel__head">

              <div className="estimator-settings-panel__title-wrap">

                <span className="estimator-settings-panel__icon">
                  <Clock3 size={15} />
                </span>

                <div>

                  <h2 className="estimator-settings-panel__title">
                    Coverage Hours
                  </h2>

                  <p className="estimator-settings-panel__description">
                    Configure the available coverage
                    duration options and their prices.
                  </p>

                </div>

              </div>

            </div>

            <div className="estimator-settings-panel__body">

              {config.hours.length === 0 ? (
                renderEmpty(
                  <Clock3 size={18} />,
                  'No coverage options yet.',
                  'Add your first coverage option below.'
                )
              ) : (
                <div className="estimator-list">

                  {config.hours.map(
                    (hour) => (
                      <div
                        className="estimator-list-row"
                        key={hour.id}
                      >

                        <input
                          type="text"
                          value={
                            hour.label || ''
                          }
                          onChange={(event) =>
                            updateHourField(
                              hour,
                              'label',
                              event.target.value
                            )
                          }
                          className="estimator-inline-input"
                          title="Coverage label"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={
                            hour.hours ?? ''
                          }
                          onChange={(event) =>
                            updateHourField(
                              hour,
                              'hours',
                              event.target.value
                            )
                          }
                          className="estimator-inline-input"
                          title="Hours"
                          placeholder="Hours"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            hour.price ?? ''
                          }
                          onChange={(event) =>
                            updateHourField(
                              hour,
                              'price',
                              event.target.value
                            )
                          }
                          className="estimator-inline-input"
                          title="Price"
                          placeholder="Price"
                        />

                        <div className="estimator-active-control">

                          <label
                            className="switch"
                            title={
                              hour.active
                                ? 'Active'
                                : 'Inactive'
                            }
                          >

                            <input
                              type="checkbox"
                              checked={
                                !!hour.active
                              }
                              onChange={(
                                event
                              ) =>
                                updateHourField(
                                  hour,
                                  'active',
                                  event.target
                                    .checked
                                    ? 1
                                    : 0
                                )
                              }
                            />

                            <span className="switch__track" />

                          </label>

                        </div>

                        <button
                          type="button"
                          className="estimator-delete"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'hour',
                              id: hour.id,
                              label: hour.label
                            })
                          }
                          aria-label={`Delete ${hour.label}`}
                          title={`Delete ${hour.label}`}
                        >

                          <Trash2
                            size={14}
                          />

                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

              {/* ADD COVERAGE */}

              <form
                onSubmit={addHour}
                className="estimator-add-row"
              >

                <input
                  type="text"
                  placeholder="Label (e.g. 10 Hours)"
                  required
                  value={newHour.label}
                  onChange={(event) =>
                    setNewHour({
                      ...newHour,
                      label:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Hours"
                  required
                  value={newHour.hours}
                  onChange={(event) =>
                    setNewHour({
                      ...newHour,
                      hours:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  required
                  value={newHour.price}
                  onChange={(event) =>
                    setNewHour({
                      ...newHour,
                      price:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <span />

                <button
                  type="submit"
                  className="
                    btn
                    btn--primary
                    btn--sm
                    estimator-add-row__action
                  "
                >
                  <Plus size={14} />
                  Add Coverage
                </button>

              </form>

            </div>

          </section>

          {/* ====================================================
              ADD-ONS
              ==================================================== */}

          <section className="estimator-settings-panel">

            <div className="estimator-settings-panel__head">

              <div className="estimator-settings-panel__title-wrap">

                <span className="estimator-settings-panel__icon">
                  <PackagePlus size={15} />
                </span>

                <div>

                  <h2 className="estimator-settings-panel__title">
                    Add-ons
                  </h2>

                  <p className="estimator-settings-panel__description">
                    Manage optional extras and
                    quantity-based pricing.
                  </p>

                </div>

              </div>

            </div>

            <div className="estimator-settings-panel__body">

              {config.addons.length === 0 ? (
                renderEmpty(
                  <PackagePlus size={18} />,
                  'No add-ons yet.',
                  'Add your first optional service below.'
                )
              ) : (
                <div className="estimator-list">

                  {config.addons.map(
                    (addon) => (
                      <div
                        className="estimator-addon-row"
                        key={addon.id}
                      >

                        <input
                          type="text"
                          value={
                            addon.label || ''
                          }
                          onChange={(event) =>
                            updateAddonField(
                              addon,
                              'label',
                              event.target.value
                            )
                          }
                          className="
                            estimator-inline-input
                            estimator-addon-label
                          "
                          placeholder="Label"
                        />

                        <input
                          type="text"
                          value={
                            addon.description ||
                            ''
                          }
                          onChange={(event) =>
                            updateAddonField(
                              addon,
                              'description',
                              event.target.value
                            )
                          }
                          className="
                            estimator-inline-input
                            estimator-addon-description
                          "
                          placeholder="Description"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            addon.price ?? ''
                          }
                          onChange={(event) =>
                            updateAddonField(
                              addon,
                              'price',
                              event.target.value
                            )
                          }
                          className="estimator-inline-input"
                          title="Price"
                          placeholder="Price"
                        />

                        {/* QUANTITY */}

                        <div className="estimator-switch-field">

                          <label
                            className="switch"
                            title="Quantity based"
                          >

                            <input
                              type="checkbox"
                              checked={
                                !!addon.is_quantity_based
                              }
                              onChange={(event) =>
                                updateAddonField(
                                  addon,
                                  'is_quantity_based',
                                  event.target.checked
                                    ? 1
                                    : 0
                                )
                              }
                            />

                            <span className="switch__track" />

                          </label>

                          <span className="estimator-switch-label">
                            Qty
                          </span>

                        </div>

                        {/* ACTIVE */}

                        <div className="estimator-switch-field">

                          <label
                            className="switch"
                            title="Active"
                          >

                            <input
                              type="checkbox"
                              checked={
                                !!addon.active
                              }
                              onChange={(event) =>
                                updateAddonField(
                                  addon,
                                  'active',
                                  event.target.checked
                                    ? 1
                                    : 0
                                )
                              }
                            />

                            <span className="switch__track" />

                          </label>

                          <span className="estimator-switch-label">
                            Active
                          </span>

                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="estimator-delete"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'addon',
                              id: addon.id,
                              label: addon.label
                            })
                          }
                          aria-label={`Delete ${addon.label}`}
                          title={`Delete ${addon.label}`}
                        >

                          <Trash2
                            size={14}
                          />

                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

              {/* ADD ADD-ON */}

              <form
                onSubmit={addAddon}
                className="estimator-addon-add-row"
              >

                <input
                  type="text"
                  placeholder="Label"
                  required
                  value={
                    newAddon.label
                  }
                  onChange={(event) =>
                    setNewAddon({
                      ...newAddon,
                      label:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={
                    newAddon.description
                  }
                  onChange={(event) =>
                    setNewAddon({
                      ...newAddon,
                      description:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  required
                  value={
                    newAddon.price
                  }
                  onChange={(event) =>
                    setNewAddon({
                      ...newAddon,
                      price:
                        event.target.value
                    })
                  }
                  className="estimator-inline-input"
                />

                <label className="estimator-addon-quantity">

                  <input
                    type="checkbox"
                    checked={
                      !!newAddon.is_quantity_based
                    }
                    onChange={(event) =>
                      setNewAddon({
                        ...newAddon,
                        is_quantity_based:
                          event.target.checked
                            ? 1
                            : 0
                      })
                    }
                  />

                  Qty Based

                </label>

                <button
                  type="submit"
                  className="
                    btn
                    btn--primary
                    btn--sm
                    estimator-addon-submit
                  "
                >
                  <Plus size={14} />
                  Add Add-on
                </button>

              </form>

            </div>

          </section>

        </div>

      </section>

      {/* ======================================================
          DELETE CONFIRMATION
          ====================================================== */}

      {confirmDelete && (
        <Modal
          title={
            `Delete "${confirmDelete.label}"?`
          }
          body={
            'This will remove it from the public estimator immediately.'
          }
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() =>
            setConfirmDelete(null)
          }
        />
      )}

    </>
  )
}