import "./EmojiButton.scss";

import buildClassName from "../../../util/buildClassName";
import useLastCallback from "../../../hooks/useLastCallback";
import { IS_EMOJI_SUPPORTED } from "../../../util/browser/windowEnvironment";
import { LOADED_EMOJIS, handleEmojiLoad } from "../../../util/emoji/emoji";
import { memo } from "../../../lib/teact/teact";

const EmojiButton = ({ emoji, focus, onClick }) => {
  const handleClick = useLastCallback((e) => {
    // Preventing safari from losing focus on Composer MessageInput
    e.preventDefault();
    onClick(emoji.native, emoji.id);
  });
  const className = buildClassName("EmojiButton", focus && "focus");
  /**
   * Original Code: const src = `${IS_PACKAGED_ELECTRON ? BASE_URL : '.'}/img-apple-64/${emoji.image}.png`;
   */
  const src = `https://web.telegram.org/a/img-apple-64/${emoji.image}.png`;
  const isLoaded = LOADED_EMOJIS.has(src);
  return (
    <div
      className={className}
      onMouseDown={handleClick}
      title={`:${emoji.names[0]}:`}
    >
      {IS_EMOJI_SUPPORTED ? (
        emoji.native
      ) : (
        <img
          src={src}
          className={!isLoaded ? "opacity-transition shown" : undefined}
          alt={emoji.native}
          loading="lazy"
          data-path={src}
          onLoad={!isLoaded ? handleEmojiLoad : undefined}
          draggable={false}
        />
      )}
    </div>
  );
};
export default memo(EmojiButton);
