import StarIcon from "../assets/images/star-amount.svg";
import useMajorUserQuery from "../hooks/useMajorUserQuery";

export default function MajorBalanceDisplay() {
  const userQuery = useMajorUserQuery();

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <h3 className="text-sm font-bold">{userQuery.data.username}</h3>
      <h4 className="text-2xl font-bold text-orange-500">
        <img src={StarIcon} className="inline h-6" />{" "}
        {Intl.NumberFormat().format(userQuery.data.rating)}
      </h4>
    </div>
  );
}
