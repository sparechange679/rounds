Rounds — Free Hospital Management System Template by uiCookies
https://uicookies.com/

Rounds is a free hospital management system (HMS) template for hospital and
clinic admin panels, built on Bootstrap 5. It is designed to read like clinical
software: a navy sidebar and a live census strip frame every screen, figures are
set in IBM Plex Mono with tabular numerals, and colour carries meaning (coral for
critical alerts and allergies, amber for warnings, teal for free beds and
arrivals). Seven pages cover a hospital day: the overview dashboard, the
inpatient list, a patient record, the OPD appointment board, the ward bed map,
the staff roster and sign-in. It is completely jQuery-free: filters, sorting,
pagination, the admit, booking and assign-bed forms, the week and day
navigation and all charts are plain vanilla JavaScript. Charts are hand-built
inline SVG with data-table fallbacks, so every section is readable without
JavaScript, and motion respects prefers-reduced-motion. All patients, staff and
the hospital (St. Aldric General) are fictional.
Free for personal and commercial use. Attribution is optional but always welcome — https://uicookies.com/license/

WHAT'S INSIDE
  index.html          Hospital overview: bed occupancy by ward, admissions and
                      discharges, ED wait, critical alerts, OPD list, staff on duty
  patients.html       Inpatient list: search, filters, sorting, pagination,
                      CSV export, admit-patient form
  patient.html        Patient record: allergies, vitals trend, medications,
                      lab results, clinical notes
  appointments.html   OPD appointment board with book-appointment dialog
  beds.html           Ward bed map, bed queue and assign-bed dialog
  staff.html          Weekly doctor and nurse roster with coverage and open shifts
  login.html          Sign-in page
  css/vendor/         Bootstrap 5.3.8 (minified, self-hosted)
  css/style.css       Template design layer (palette, type, components)
  js/vendor/          Bootstrap 5.3.8 bundle (includes Popper)
  js/main.js          Template behaviour — vanilla JavaScript, no jQuery
  img/                Sign-in page photo
  CREDITS.txt         Photo provenance

NOTES
  - Built on Bootstrap 5. No jQuery, no chart library, no other plugins.
  - Colours, fonts, radii and the sidebar width are CSS custom properties at the
    top of css/style.css. Dark theme values follow in the [data-bs-theme="dark"]
    block.
  - Chart data (ward occupancy, patient flow, vitals) lives in the DATA block at
    the top of js/main.js. The bed map, appointment board and roster are plain
    HTML; the script reads them from the page.
  - Forms are front-end only. They validate in the browser and update the page,
    but nothing is saved: connect them to your hospital system, API or a form
    service to make them live.
  - The sidebar, topbar and census strip are repeated in each page. Change them
    in every file, or move them into your framework's layout.
  - Replace img/login-hospital.jpg with your own photo before launch.
