import { useEffect, useState } from 'react'
import { estimatorApi } from '../services/api.js'
import {
  peso,
  formatDateTime
} from '../utils/format.js'

import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'

import html2pdf from 'html2pdf.js'

import {
  Download,
  Filter,
  ChevronDown
} from 'lucide-react'

const TIMEFRAMES = [
  {
    value: 'today',
    label: 'Today'
  },
  {
    value: 'last_week',
    label: 'Last Week'
  },
  {
    value: 'last_month',
    label: 'Last Month'
  },
  {
    value: 'last_3_months',
    label: 'Last 3 Months'
  },
  {
    value: 'last_quarter',
    label: 'Last Quarter'
  },
  {
    value: 'last_year',
    label: 'Last Year'
  },
  {
    value: 'all',
    label: 'All Time / Archive'
  }
]

export default function EstimatorLeads() {
  const [leads, setLeads] =
    useState(null)

  const [timeframe, setTimeframe] =
    useState('today')

  const [updatingId, setUpdatingId] =
    useState(null)

  const [isExporting, setIsExporting] =
    useState(false)

  const { showToast } =
    useToast()

  /*
  ============================================================
  PAGE TITLE
  ============================================================
  */

  useEffect(() => {
    document.title =
      'Admin — Estimator Leads'
  }, [])

  /*
  ============================================================
  LOAD LEADS
  ============================================================
  */

  const fetchLeads = () => {
    setLeads(null)

    estimatorApi
      .leads(timeframe)
      .then((data) => {
        setLeads(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        setLeads([])
      })
  }

  useEffect(() => {
    fetchLeads()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  /*
  ============================================================
  STATUS CHANGE
  ============================================================
  */

  const handleStatusChange = async (
    id,
    newStatus
  ) => {
    setUpdatingId(id)

    try {
      await estimatorApi.updateLeadStatus(
        id,
        newStatus
      )

      showToast(
        'Lead status updated successfully.',
        'success'
      )

      setLeads((current) => {
        if (!Array.isArray(current)) {
          return current
        }

        return current.map(
          (lead) =>
            lead.id === id
              ? {
                  ...lead,
                  status: newStatus
                }
              : lead
        )
      })
    } catch (error) {
      showToast(
        error?.message ||
          'Failed to update status.',
        'error'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  /*
  ============================================================
  STATUS CLASS
  ============================================================
  */

  const getStatusClass = (status) => {
    switch (status) {
      case 'Booked':
        return 'estimator-status estimator-status--booked'

      case 'Contacted':
        return 'estimator-status estimator-status--contacted'

      case 'Lost':
        return 'estimator-status estimator-status--lost'

      default:
        return 'estimator-status estimator-status--new'
    }
  }

  /*
  ============================================================
  ADD-ONS
  ============================================================
  */

  const parseAddons = (value) => {
    try {
      const parsed =
        JSON.parse(value || '[]')

      return Array.isArray(parsed)
        ? parsed
        : []
    } catch {
      return []
    }
  }

  /*
  ============================================================
  PDF EXPORT
  ============================================================
  */

  const exportToPDF = async () => {
    const element =
      document.getElementById(
        'estimator-leads-export'
      )

    const header =
      document.getElementById(
        'estimator-leads-pdf-header'
      )

    if (
      !element ||
      !leads ||
      leads.length === 0
    ) {
      return
    }

    setIsExporting(true)

    if (header) {
      header.style.display = 'block'
    }

    const opt = {
      margin: 0.5,

      filename:
        `Estimator_Leads_${timeframe}.pdf`,

      image: {
        type: 'jpeg',
        quality: 0.98
      },

      html2canvas: {
        scale: 2
      },

      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'landscape'
      }
    }

    try {
      await html2pdf()
        .set(opt)
        .from(element)
        .save()
    } finally {
      if (header) {
        header.style.display = 'none'
      }

      setIsExporting(false)
    }
  }

  const timeframeLabel =
    TIMEFRAMES.find(
      (item) =>
        item.value === timeframe
    )?.label ||
    'All Time / Archive'

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
        ESTIMATOR LEADS
        ============================================================
        */

        .estimator-leads-page {
          width: 100%;
        }

        .estimator-leads-content {
          width: 100%;

          max-width:
            1100px;
        }

        /*
        ============================================================
        INTRO
        ============================================================
        */

        .estimator-leads-intro {
          margin-bottom:
            18px;

          color:
            var(--c-gray);
        }

        .estimator-leads-intro p {
          margin: 0;

          max-width:
            70ch;
        }

        /*
        ============================================================
        TOOLBAR
        ============================================================
        */

        .estimator-leads-toolbar {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin-bottom:
            20px;

          padding:
            12px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .estimator-leads-filter {
          display: flex;

          align-items: center;

          gap: 9px;

          min-width: 0;
        }

        .estimator-leads-filter__icon {
          flex: 0 0 auto;

          color:
            #777;
        }

        .estimator-leads-filter__label {
          color:
            var(--c-gray);
        }

        .estimator-leads-select-wrap {
          position: relative;

          display: flex;

          align-items: center;
        }

        .estimator-leads-select {
          min-height:
            40px;

          padding:
            0 34px 0 11px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fafafa;

          color:
            var(--c-text, #111);

          outline:
            none;

          cursor:
            pointer;

          font:
            inherit;

          appearance:
            auto;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .estimator-leads-select:hover {
          background:
            #fff;

          border-color:
            #c5c5c5;
        }

        .estimator-leads-select:focus {
          background:
            #fff;

          border-color:
            var(--c-text, #111);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .estimator-leads-select-arrow {
          position: absolute;

          right:
            10px;

          pointer-events:
            none;

          color:
            #888;
        }

        /*
        ============================================================
        EXPORT
        ============================================================
        */

        .estimator-leads-export {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 8px;

          min-height:
            40px;

          padding:
            0 15px;

          white-space:
            nowrap;
        }

        .estimator-leads-export:disabled {
          opacity:
            0.6;

          cursor:
            wait;
        }

        /*
        ============================================================
        DATA PANEL
        ============================================================
        */

        .estimator-leads-panel {
          overflow:
            hidden;

          padding:
            0;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        /*
        ============================================================
        PDF HEADER
        ============================================================
        */

        .estimator-leads-pdf-header {
          display: none;

          margin:
            22px;

          padding-bottom:
            15px;

          border-bottom:
            2px solid
            #111827;
        }

        .estimator-leads-pdf-header h2 {
          margin:
            0;

          color:
            #111827;
        }

        .estimator-leads-pdf-header__meta {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top:
            8px;

          color:
            #4b5563;
        }

        /*
        ============================================================
        TABLE
        ============================================================
        */

        .estimator-leads-table-wrap {
          width:
            100%;

          overflow-x:
            auto;
        }

        .estimator-leads-table {
          width:
            100%;

          min-width:
            900px;

          border-collapse:
            collapse;
        }

        .estimator-leads-table th {
          padding:
            13px 15px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            #fafafa;

          color:
            #777;

          text-align:
            left;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }

        .estimator-leads-table td {
          padding:
            14px 15px;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);

          color:
            var(--c-text, #111);

          vertical-align:
            middle;
        }

        .estimator-leads-table tbody tr {
          transition:
            background 0.18s ease;
        }

        .estimator-leads-table tbody tr:hover {
          background:
            #fafafa;
        }

        .estimator-leads-table tbody tr:last-child td {
          border-bottom:
            0;
        }

        /*
        ============================================================
        CLIENT
        ============================================================
        */

        .estimator-lead-client {
          min-width:
            150px;
        }

        .estimator-lead-client__name {
          display: block;
        }

        .estimator-lead-client__email {
          display: block;

          margin-top:
            3px;

          color:
            var(--c-gray);
        }

        /*
        ============================================================
        ADD-ONS
        ============================================================
        */

        .estimator-lead-addons {
          display: block;

          max-width:
            230px;

          line-height:
            1.45;

          color:
            var(--c-gray);
        }

        /*
        ============================================================
        STATUS
        ============================================================
        */

        .estimator-status-control {
          position: relative;

          display: inline-flex;

          align-items: center;
        }

        .estimator-status {
          min-width:
            105px;

          min-height:
            36px;

          padding:
            0 30px 0 10px;

          border:
            1px solid
            #d6d6d6;

          border-radius:
            7px;

          outline:
            none;

          cursor:
            pointer;

          font:
            inherit;

          appearance:
            auto;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            opacity 0.2s ease;
        }

        .estimator-status:hover:not(:disabled) {
          border-color:
            #bdbdbd;
        }

        .estimator-status:focus {
          border-color:
            #111;

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        .estimator-status:disabled {
          cursor:
            wait;

          opacity:
            0.6;
        }

        .estimator-status--new {
          background:
            #f3f4f6;

          color:
            #374151;
        }

        .estimator-status--contacted {
          background:
            #fef3c7;

          color:
            #92400e;
        }

        .estimator-status--booked {
          background:
            #dcfce7;

          color:
            #166534;
        }

        .estimator-status--lost {
          background:
            #fee2e2;

          color:
            #991b1b;
        }

        .estimator-status-spinner {
          position: absolute;

          right:
            10px;

          width:
            12px;

          height:
            12px;

          border:
            2px solid
            rgba(
              0,
              0,
              0,
              0.15
            );

          border-top-color:
            #111;

          border-radius:
            50%;

          animation:
            estimator-spin
            0.7s linear infinite;
        }

        @keyframes estimator-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /*
        ============================================================
        EMPTY / LOADING SPACE
        ============================================================
        */

        .estimator-leads-table-count {
          padding:
            11px 15px;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);

          color:
            var(--c-gray);
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 760px) {

          .estimator-leads-toolbar {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .estimator-leads-filter {
            width:
              100%;
          }

          .estimator-leads-select-wrap {
            flex:
              1;
          }

          .estimator-leads-select {
            width:
              100%;
          }

          .estimator-leads-export {
            width:
              100%;
          }

          .estimator-leads-pdf-header__meta {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              5px;
          }

        }

        @media (max-width: 500px) {

          .estimator-leads-toolbar {
            padding:
              10px;
          }

          .estimator-leads-filter {
            align-items:
              stretch;

            flex-direction:
              column;

            gap:
              7px;
          }

          .estimator-leads-filter__label {
            display:
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

          .estimator-leads-select,
          .estimator-leads-table tbody tr,
          .estimator-status {
            transition:
              none;
          }

          .estimator-status-spinner {
            animation:
              none;
          }

        }

      `}</style>

      <section className="estimator-leads-page">

        <div className="admin-content estimator-leads-content">

          {/* ====================================================
              DESCRIPTION
              ==================================================== */}

          <div className="estimator-leads-intro">
            <p>
              People who priced a package but
              haven't necessarily submitted a
              booking yet.
            </p>
          </div>

          {/* ====================================================
              TOOLBAR
              ==================================================== */}

          <div className="estimator-leads-toolbar">

            <div className="estimator-leads-filter">

              <Filter
                size={16}
                className="estimator-leads-filter__icon"
                aria-hidden="true"
              />

              <span className="estimator-leads-filter__label">
                Period
              </span>

              <div className="estimator-leads-select-wrap">

                <select
                  className="estimator-leads-select"
                  value={timeframe}
                  onChange={(event) =>
                    setTimeframe(
                      event.target.value
                    )
                  }
                  aria-label="Filter estimator leads by timeframe"
                >

                  {TIMEFRAMES.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    )
                  )}

                </select>

                <ChevronDown
                  size={14}
                  className="estimator-leads-select-arrow"
                  aria-hidden="true"
                />

              </div>

            </div>

            <button
              type="button"
              onClick={exportToPDF}
              disabled={
                isExporting ||
                !leads ||
                leads.length === 0
              }
              className="
                btn
                btn--primary
                estimator-leads-export
              "
            >

              <Download
                size={16}
                aria-hidden="true"
              />

              {isExporting
                ? 'Preparing…'
                : 'Download PDF'}

            </button>

          </div>

          {/* ====================================================
              LOADING
              ==================================================== */}

          {leads === null && (
            <LoadingState
              label="Loading leads…"
            />
          )}

          {/* ====================================================
              EMPTY
              ==================================================== */}

          {leads &&
            leads.length === 0 && (
              <EmptyState
                title="No estimator leads found."
                body="Try changing the date filter or wait for new leads."
              />
            )}

          {/* ====================================================
              DATA
              ==================================================== */}

          {leads &&
            leads.length > 0 && (
              <div
                className="
                  admin-panel
                  estimator-leads-panel
                "
                id="estimator-leads-export"
              >

                {/* PDF HEADER */}

                <div
                  id="estimator-leads-pdf-header"
                  className="estimator-leads-pdf-header"
                >

                  <h2>
                    Jonathan Photography —
                    Estimator Leads Report
                  </h2>

                  <div className="estimator-leads-pdf-header__meta">

                    <span>
                      <strong>
                        Timeframe:
                      </strong>{' '}
                      {timeframeLabel}
                    </span>

                    <span>
                      <strong>
                        Generated:
                      </strong>{' '}
                      {new Date().toLocaleDateString()}{' '}
                      at{' '}
                      {new Date().toLocaleTimeString()}
                    </span>

                  </div>

                </div>

                {/* COUNT */}

                <div className="estimator-leads-table-count">
                  {leads.length}{' '}
                  {leads.length === 1
                    ? 'lead'
                    : 'leads'}{' '}
                  found
                </div>

                {/* TABLE */}

                <div className="estimator-leads-table-wrap">

                  <table className="estimator-leads-table">

                    <thead>

                      <tr>

                        <th>
                          Name
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Hours
                        </th>

                        <th>
                          Service
                        </th>

                        <th>
                          Add-ons
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Date
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {leads.map(
                        (lead) => {
                          const addons =
                            parseAddons(
                              lead.addons
                            )

                          const currentStatus =
                            lead.status ||
                            (
                              lead.booked_live
                                ? 'Booked'
                                : 'New'
                            )

                          return (
                            <tr
                              key={
                                lead.id
                              }
                            >

                              {/* NAME */}

                              <td className="estimator-lead-client">

                                <strong className="estimator-lead-client__name">
                                  {lead.name ||
                                    'Unnamed Lead'}
                                </strong>

                              </td>

                              {/* EMAIL */}

                              <td>
                                {lead.email ||
                                  '—'}
                              </td>

                              {/* HOURS */}

                              <td>
                                {lead.hours ||
                                  '—'}
                              </td>

                              {/* SERVICE */}

                              <td>
                                {lead.service_type ||
                                  '—'}
                              </td>

                              {/* ADD-ONS */}

                              <td>

                                <span className="estimator-lead-addons">
                                  {addons.length
                                    ? addons
                                        .map(
                                          (
                                            addon
                                          ) =>
                                            addon.label
                                        )
                                        .join(
                                          ', '
                                        )
                                    : '—'}
                                </span>

                              </td>

                              {/* TOTAL */}

                              <td>
                                {peso(
                                  lead.total
                                )}
                              </td>

                              {/* STATUS */}

                              <td>

                                <div className="estimator-status-control">

                                  <select
                                    className={getStatusClass(
                                      currentStatus
                                    )}
                                    value={
                                      currentStatus
                                    }
                                    disabled={
                                      updatingId ===
                                      lead.id
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleStatusChange(
                                        lead.id,
                                        event.target
                                          .value
                                      )
                                    }
                                    aria-label={`Status for ${lead.name || 'lead'}`}
                                  >

                                    <option value="New">
                                      New
                                    </option>

                                    <option value="Contacted">
                                      Contacted
                                    </option>

                                    <option value="Booked">
                                      Booked
                                    </option>

                                    <option value="Lost">
                                      Lost
                                    </option>

                                  </select>

                                  {updatingId ===
                                    lead.id && (
                                    <span
                                      className="estimator-status-spinner"
                                      aria-hidden="true"
                                    />
                                  )}

                                </div>

                              </td>

                              {/* DATE */}

                              <td>
                                {formatDateTime(
                                  lead.created_at
                                )}
                              </td>

                            </tr>
                          )
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

        </div>

      </section>
    </>
  )
}