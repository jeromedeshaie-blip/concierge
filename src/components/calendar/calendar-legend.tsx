export function CalendarLegend() {
  const items = [
    { color: "bg-red-400", label: "Airbnb" },
    { color: "bg-blue-400", label: "Booking.com" },
    { color: "bg-gray-400", label: "Manuel / Direct" },
    { color: "bg-purple-400", label: "Autre" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
      <span className="font-medium">Légende :</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
