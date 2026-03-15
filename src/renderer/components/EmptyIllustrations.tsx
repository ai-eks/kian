/**
 * Inline SVG illustrations for empty states.
 * Uses the app's blue palette (#2f6ff7 primary, #e8f1ff / #edf3ff light fills).
 */

/** New-project card: a layered document with a sparkle */
export const IllustrationNewProject = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* back doc */}
    <rect x="22" y="14" width="36" height="46" rx="6" fill="#e8f1ff" />
    {/* front doc */}
    <rect
      x="16"
      y="20"
      width="36"
      height="46"
      rx="6"
      fill="#fff"
      stroke="#c5d6f7"
      strokeWidth="1.6"
    />
    {/* lines on front doc */}
    <rect x="24" y="32" width="20" height="2.4" rx="1.2" fill="#d4e2fa" />
    <rect x="24" y="39" width="14" height="2.4" rx="1.2" fill="#d4e2fa" />
    <rect x="24" y="46" width="18" height="2.4" rx="1.2" fill="#d4e2fa" />
    {/* sparkle / plus star */}
    <circle cx="58" cy="24" r="11" fill="#2f6ff7" />
    <rect x="55.5" y="18.5" width="5" height="11" rx="2.5" fill="#fff" />
    <rect
      x="52.5"
      y="21.5"
      width="11"
      height="5"
      rx="2.5"
      fill="#fff"
    />
  </svg>
);

/** Empty file list: a folder with a dashed document */
export const IllustrationEmptyFiles = ({ size = 80 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* folder body */}
    <rect x="12" y="30" width="72" height="48" rx="8" fill="#e8f1ff" />
    {/* folder tab */}
    <path
      d="M12 38c0-4.418 3.582-8 8-8h16l6 8H12z"
      fill="#d4e2fa"
    />
    {/* dashed doc inside */}
    <rect
      x="32"
      y="42"
      width="32"
      height="28"
      rx="4"
      fill="#fff"
      stroke="#b8ccf0"
      strokeWidth="1.4"
      strokeDasharray="4 3"
    />
    {/* small lines */}
    <rect x="38" y="50" width="14" height="2" rx="1" fill="#d4e2fa" />
    <rect x="38" y="56" width="10" height="2" rx="1" fill="#d4e2fa" />
    <rect x="38" y="62" width="18" height="2" rx="1" fill="#d4e2fa" />
  </svg>
);

/** Empty editor: a blank page with a pencil */
export const IllustrationEmptyEditor = ({ size = 96 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* page */}
    <rect
      x="20"
      y="12"
      width="44"
      height="58"
      rx="6"
      fill="#fff"
      stroke="#c5d6f7"
      strokeWidth="1.6"
    />
    {/* faint lines */}
    <rect x="28" y="26" width="24" height="2.2" rx="1.1" fill="#e3ecfa" />
    <rect x="28" y="33" width="18" height="2.2" rx="1.1" fill="#e3ecfa" />
    <rect x="28" y="40" width="22" height="2.2" rx="1.1" fill="#e3ecfa" />
    <rect x="28" y="47" width="16" height="2.2" rx="1.1" fill="#e3ecfa" />
    {/* pencil */}
    <g transform="translate(54,50) rotate(-45)">
      <rect x="0" y="0" width="7" height="30" rx="1.5" fill="#2f6ff7" />
      <rect x="0" y="0" width="7" height="6" rx="1.5" fill="#1a5ad4" />
      <polygon points="0,30 3.5,38 7,30" fill="#f7c948" />
    </g>
  </svg>
);

/** Empty creation board: a storyboard card group with a play cue */
export const IllustrationEmptyCreationBoard = ({
  size = 168,
}: {
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 176 176"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="20" y="30" width="136" height="98" rx="16" fill="#f5f9ff" stroke="#d6e4fb" strokeWidth="1.8" />
    <rect x="20" y="30" width="136" height="18" rx="16" fill="#eaf2ff" />
    <circle cx="34" cy="39" r="2.8" fill="#aec4ec" />
    <circle cx="44" cy="39" r="2.8" fill="#aec4ec" />
    <circle cx="54" cy="39" r="2.8" fill="#aec4ec" />

    <rect x="33" y="59" width="33" height="22" rx="6" fill="#ffffff" stroke="#d4e1f8" strokeWidth="1.4" />
    <rect x="71.5" y="59" width="33" height="22" rx="6" fill="#ffffff" stroke="#d4e1f8" strokeWidth="1.4" />
    <rect x="110" y="59" width="33" height="22" rx="6" fill="#ffffff" stroke="#d4e1f8" strokeWidth="1.4" />

    <rect x="36.5" y="63" width="17" height="3" rx="1.5" fill="#dbe8fc" />
    <rect x="36.5" y="69" width="12" height="3" rx="1.5" fill="#dbe8fc" />
    <rect x="75" y="63" width="17" height="3" rx="1.5" fill="#dbe8fc" />
    <rect x="75" y="69" width="12" height="3" rx="1.5" fill="#dbe8fc" />
    <rect x="113.5" y="63" width="17" height="3" rx="1.5" fill="#dbe8fc" />
    <rect x="113.5" y="69" width="12" height="3" rx="1.5" fill="#dbe8fc" />

    <rect x="33" y="90" width="110" height="24" rx="8" fill="#ffffff" stroke="#d4e1f8" strokeWidth="1.4" />
    <rect x="41" y="97" width="56" height="3.2" rx="1.6" fill="#cfe0fb" />
    <rect x="41" y="103" width="72" height="3.2" rx="1.6" fill="#dbe8fc" />

    <circle cx="135" cy="105" r="12" fill="#2f6ff7" />
    <path d="M132 99.5l8 5.5-8 5.5v-11z" fill="#ffffff" />

    <circle cx="124" cy="22" r="12" fill="#2f6ff7" />
    <path d="M124 16.2v11.6M118.2 22h11.6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** Empty cron jobs: a clock with circular dashes */
export const IllustrationEmptyCronjob = ({ size = 96 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* outer ring */}
    <circle cx="48" cy="48" r="34" fill="#e8f1ff" />
    {/* clock face */}
    <circle
      cx="48"
      cy="48"
      r="26"
      fill="#fff"
      stroke="#c5d6f7"
      strokeWidth="1.6"
    />
    {/* tick marks */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
      <line
        key={deg}
        x1="48"
        y1="25"
        x2="48"
        y2="28"
        stroke="#b8ccf0"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform={`rotate(${deg} 48 48)`}
      />
    ))}
    {/* hour hand */}
    <line
      x1="48"
      y1="48"
      x2="48"
      y2="33"
      stroke="#2f6ff7"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    {/* minute hand */}
    <line
      x1="48"
      y1="48"
      x2="59"
      y2="42"
      stroke="#2f6ff7"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* center dot */}
    <circle cx="48" cy="48" r="2.5" fill="#2f6ff7" />
    {/* small recurring arrows */}
    <path
      d="M72 54a26 26 0 0 1-8 12"
      stroke="#b8ccf0"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M64 66l0.5-4 3.5 1"
      stroke="#b8ccf0"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
