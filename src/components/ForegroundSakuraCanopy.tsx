import React from 'react'

interface ForegroundSakuraCanopyProps {
  mouseX: number
  mouseY: number
  breezeX: number
}

export const ForegroundSakuraCanopy: React.FC<ForegroundSakuraCanopyProps> = ({
  mouseX,
  mouseY,
  breezeX
}) => {
  // Foreground branches have pronounced parallax depth (~22px) and wind breeze deflection
  const offsetXLeft = mouseX * 22 + breezeX * 4
  const offsetYLeft = mouseY * 14
  const offsetXRight = mouseX * 26 + breezeX * 5
  const offsetYRight = mouseY * 16

  return (
    <div className="foreground-sakura-canopy-root" aria-hidden="true">
      {/* Top-Left Overhanging Blossom Branch Canopy */}
      <div
        className="canopy-branch-wrapper branch-top-left"
        style={{
          transform: `translate3d(${offsetXLeft}px, ${offsetYLeft}px, 0)`
        }}
      >
        <svg
          className="canopy-svg canopy-svg-left"
          viewBox="0 0 520 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Gnarled Branch Trunk */}
          <path
            d="M-20 -20 C 110 40, 220 80, 360 90 C 430 95, 480 80, 520 60 C 480 90, 410 110, 340 105 C 210 95, 100 60, -20 10 Z"
            fill="#2A1625"
            opacity="0.9"
          />
          {/* Secondary Sub-Branch */}
          <path
            d="M 180 75 C 230 130, 270 180, 340 220 C 320 215, 270 170, 220 120 C 190 90, 185 80, 180 75 Z"
            fill="#231220"
            opacity="0.85"
          />
          {/* Tertiary Tendril */}
          <path
            d="M 310 100 C 360 140, 390 190, 420 240 C 410 225, 380 180, 340 140 Z"
            fill="#20101E"
            opacity="0.8"
          />

          {/* Blossom Clusters (Animated sway group) */}
          <g className="blossom-cluster-sway sway-group-1">
            <circle cx="340" cy="220" r="14" fill="#F9CADB" opacity="0.95" />
            <circle cx="350" cy="210" r="12" fill="#FFDEEA" opacity="0.9" />
            <circle cx="330" cy="228" r="13" fill="#FCE4ED" opacity="0.92" />
            <circle cx="340" cy="220" r="4" fill="#FFB859" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-2">
            <circle cx="420" cy="240" r="16" fill="#F9CADB" opacity="0.95" />
            <circle cx="435" cy="235" r="13" fill="#FFDEEA" opacity="0.9" />
            <circle cx="410" cy="250" r="14" fill="#E896B8" opacity="0.85" />
            <circle cx="420" cy="240" r="4.5" fill="#FFE2C4" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-3">
            <circle cx="260" cy="120" r="18" fill="#FFDEEA" opacity="0.92" />
            <circle cx="280" cy="115" r="15" fill="#F9CADB" opacity="0.95" />
            <circle cx="250" cy="135" r="14" fill="#FCE4ED" opacity="0.9" />
            <circle cx="265" cy="122" r="5" fill="#FFB859" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-1">
            <circle cx="480" cy="75" r="17" fill="#F9CADB" opacity="0.95" />
            <circle cx="495" cy="70" r="14" fill="#FFDEEA" opacity="0.92" />
            <circle cx="465" cy="85" r="15" fill="#E896B8" opacity="0.88" />
            <circle cx="480" cy="75" r="4" fill="#FFE2C4" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-2">
            <circle cx="140" cy="55" r="16" fill="#FFDEEA" opacity="0.92" />
            <circle cx="155" cy="45" r="13" fill="#F9CADB" opacity="0.95" />
            <circle cx="125" cy="65" r="15" fill="#FCE4ED" opacity="0.9" />
          </g>
        </svg>
      </div>

      {/* Top-Right Overhanging Blossom Branch Canopy (Framing Mount Fuji and Moon) */}
      <div
        className="canopy-branch-wrapper branch-top-right"
        style={{
          transform: `translate3d(${offsetXRight}px, ${offsetYRight}px, 0)`
        }}
      >
        <svg
          className="canopy-svg canopy-svg-right"
          viewBox="0 0 540 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Gnarled Branch Trunk from right edge */}
          <path
            d="M 560 -20 C 440 35, 330 75, 190 95 C 130 102, 70 85, 20 65 C 60 95, 140 115, 210 110 C 330 100, 440 60, 560 10 Z"
            fill="#271422"
            opacity="0.9"
          />
          {/* Downward Tendril */}
          <path
            d="M 330 80 C 280 135, 240 185, 170 230 C 190 220, 240 175, 290 125 C 320 95, 325 85, 330 80 Z"
            fill="#200F1C"
            opacity="0.85"
          />

          {/* Blossom Clusters with staggered breeze flex */}
          <g className="blossom-cluster-sway sway-group-2">
            <circle cx="170" cy="230" r="16" fill="#F9CADB" opacity="0.95" />
            <circle cx="155" cy="225" r="13" fill="#FFDEEA" opacity="0.92" />
            <circle cx="185" cy="240" r="14" fill="#FCE4ED" opacity="0.9" />
            <circle cx="170" cy="230" r="4" fill="#FFB859" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-3">
            <circle cx="100" cy="80" r="18" fill="#FFDEEA" opacity="0.95" />
            <circle cx="85" cy="75" r="14" fill="#F9CADB" opacity="0.9" />
            <circle cx="115" cy="90" r="15" fill="#E896B8" opacity="0.85" />
            <circle cx="100" cy="80" r="4.5" fill="#FFE2C4" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-1">
            <circle cx="260" cy="130" r="17" fill="#F9CADB" opacity="0.95" />
            <circle cx="245" cy="122" r="14" fill="#FFDEEA" opacity="0.9" />
            <circle cx="275" cy="140" r="15" fill="#FCE4ED" opacity="0.92" />
            <circle cx="260" cy="130" r="4" fill="#FFB859" opacity="0.8" />
          </g>

          <g className="blossom-cluster-sway sway-group-2">
            <circle cx="390" cy="55" r="18" fill="#FFDEEA" opacity="0.9" />
            <circle cx="410" cy="50" r="15" fill="#F9CADB" opacity="0.95" />
            <circle cx="375" cy="68" r="14" fill="#E896B8" opacity="0.85" />
          </g>
        </svg>
      </div>

      {/* Bottom-Left & Bottom-Right Soft Blurred Blossom Bokeh Layers (Depth of Field) */}
      <div
        className="foreground-bokeh-cluster bokeh-bottom-left"
        style={{
          transform: `translate3d(${offsetXLeft * 1.3}px, ${offsetYLeft * 1.3}px, 0)`
        }}
      >
        <span className="bokeh-blossom petal-1" />
        <span className="bokeh-blossom petal-2" />
        <span className="bokeh-blossom petal-3" />
      </div>

      <div
        className="foreground-bokeh-cluster bokeh-bottom-right"
        style={{
          transform: `translate3d(${offsetXRight * 1.3}px, ${offsetYRight * 1.3}px, 0)`
        }}
      >
        <span className="bokeh-blossom petal-4" />
        <span className="bokeh-blossom petal-5" />
      </div>
    </div>
  )
}
