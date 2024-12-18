import useZooDataQueries from "../hooks/useZooDataQueries";
import RiddleIcon from "../assets/images/riddle.png?format=webp&w=80";
import RebusIcon from "../assets/images/rebus.png?format=webp&w=80";

export default function ZooQuiz() {
  const dataQueries = useZooDataQueries();
  const [allData] = dataQueries.data;

  /** Riddle */
  const riddle = allData.dbData.dbQuests.find((quest) =>
    quest.key.startsWith("riddle_")
  );

  /** Rebus */
  const rebus = allData.dbData.dbQuests.find((quest) =>
    quest.key.startsWith("rebus_")
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Rebus */}
      <div className="flex gap-2 p-4 text-white rounded-lg bg-lime-800">
        <img src={RiddleIcon} className="w-10 h-10 shrink-0" />
        <div className="min-w-0 min-h-0 grow">
          <h3 className="font-bold">Riddle</h3>
          <p>
            <q>{riddle.desc}</q> -{" "}
            <span className="font-bold">{riddle.checkData}</span>
          </p>
        </div>
      </div>

      {/* Rebus */}
      <div className="flex gap-2 p-4 text-white rounded-lg bg-lime-800">
        <img src={RebusIcon} className="w-10 h-10 shrink-0" />
        <div className="min-w-0 min-h-0 grow">
          <h3 className="font-bold">Rebus</h3>
          <p>
            <q>{rebus.title}</q> -{" "}
            <span className="font-bold">{rebus.checkData}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
