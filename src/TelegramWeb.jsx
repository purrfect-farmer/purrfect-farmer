export default function TelegramWeb({ version }) {
  return (
    <iframe
      src={`https://web.telegram.org/${version}`}
      className="w-full h-full border-0 outline-0"
    />
  );
}
