/* eslint-disable react/prop-types */
import "./SegmentedProgressBar.css";

export default function SegmentedProgressBar({ data }) {
  return (
    <div className="spb-wrapper">
      <div className="spb-bar">
        {data.map((item, i) => (
          <div
            key={i}
            className="spb-segment"
            style={{
              width: `${item.value}%`,
              background: item.color,
            }}
          />
        ))}
      </div>
      <div className="spb-legend">
        {data.map((item, i) => (
          <div key={i} className="spb-legend-item">
            <span className="spb-legend-color" style={{ background: item.color }} />
            {item.label} {item.value.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  );
}
