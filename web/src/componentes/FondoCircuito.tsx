export function FondoCircuito() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="fondo-rejilla absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-violeta/14 blur-[140px]" />
      <div className="absolute top-1/3 -left-48 h-[420px] w-[420px] rounded-full bg-electrica/12 blur-[130px]" />
      <div className="absolute -right-48 bottom-0 h-[420px] w-[520px] rounded-full bg-cian/10 blur-[130px]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g strokeLinecap="round">
          <path
            d="M-40 210 H240 L320 130 H560 L640 210 H980"
            stroke="#087ef5"
            strokeOpacity="0.28"
            strokeWidth="1.4"
          />
          <path
            d="M320 130 L320 420 H520 L640 300"
            stroke="#00dff0"
            strokeOpacity="0.22"
            strokeWidth="1.4"
          />
          <path
            d="M560 210 V560 H860 L960 660"
            stroke="#8438f4"
            strokeOpacity="0.24"
            strokeWidth="1.4"
          />
          <path
            d="M1480 180 H1240 L1160 260 H1020"
            stroke="#087ef5"
            strokeOpacity="0.26"
            strokeWidth="1.4"
          />
          <path
            d="M1160 260 V520 H1080"
            stroke="#00d8c8"
            strokeOpacity="0.2"
            strokeWidth="1.4"
          />
          <path
            d="M1480 760 H1180 L1080 660"
            stroke="#8438f4"
            strokeOpacity="0.22"
            strokeWidth="1.4"
          />
          <path
            d="M-40 640 H220 L320 540 H520"
            stroke="#00d8c8"
            strokeOpacity="0.2"
            strokeWidth="1.4"
          />
          <path
            d="M320 420 V640 H520 V760 H740"
            stroke="#087ef5"
            strokeOpacity="0.22"
            strokeWidth="1.4"
          />
        </g>
        <g fill="#00dff0">
          {[
            [320, 130],
            [320, 420],
            [560, 210],
            [520, 300],
            [640, 300],
            [860, 560],
            [1160, 260],
            [1080, 660],
            [520, 760],
            [740, 760],
            [1080, 520],
            [240, 210],
            [980, 210],
            [960, 660],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4"
              fillOpacity="0.85"
              style={{ animation: `nodo 4s ease-in-out ${(i % 5) * 0.8}s infinite` }}
            />
          ))}
        </g>
        <g fill="#8438f4">
          {[
            [640, 210],
            [320, 540],
            [320, 640],
            [520, 640],
            [1160, 520],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fillOpacity="0.9"
              style={{ animation: `nodo 4s ease-in-out ${(i % 4) * 1.1}s infinite` }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
