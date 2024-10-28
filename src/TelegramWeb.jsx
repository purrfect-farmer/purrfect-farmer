export default function TelegramWeb({ version, hash = "" }) {
  return (
    <iframe
      src={`https://web.telegram.org/${version}${hash}`}
      className="w-full h-full border-0 outline-0"
    />
  );
}
