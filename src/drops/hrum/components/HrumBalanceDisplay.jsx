export default function HrumBalanceDisplay({ balance }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <h4 className="text-2xl font-bold ">
        {Intl.NumberFormat().format(balance)}
      </h4>
    </div>
  );
}
