import EMOJI_REGEX from "../../../lib/twemojiRegex";
import MentionLink from "../../middle/message/MentionLink";
import SafeLink from "../SafeLink";
import buildClassName from "../../../util/buildClassName";
import fixNonStandardEmoji from "../../../util/emoji/fixNonStandardEmoji";
import { IS_EMOJI_SUPPORTED } from "../../../util/browser/windowEnvironment";
import {
  LOADED_EMOJIS,
  handleEmojiLoad,
  nativeToUnifiedExtendedWithCache,
} from "../../../util/emoji/emoji";
import { RE_LINK_TEMPLATE, RE_MENTION_TEMPLATE } from "../../../config";
import { compact } from "../../../util/iteratees";
import { isDeepLink } from "../../../util/deepLinkParser";
const SIMPLE_MARKDOWN_REGEX = /(\*\*|__).+?\1/g;
export default function renderText(part, filters = ["emoji"], params) {
  if (typeof part !== "string") {
    return [part];
  }
  return compact(
    filters.reduce(
      (text, filter) => {
        switch (filter) {
          case "escape_html":
            return escapeHtml(text);
          case "hq_emoji":
            EMOJI_REGEX.lastIndex = 0;
            return replaceEmojis(text, "big", "jsx");
          case "emoji":
            EMOJI_REGEX.lastIndex = 0;
            return replaceEmojis(text, "small", "jsx");
          case "emoji_html":
            EMOJI_REGEX.lastIndex = 0;
            return replaceEmojis(text, "small", "html");
          case "br":
            return addLineBreaks(text, "jsx");
          case "br_html":
            return addLineBreaks(text, "html");
          case "highlight":
            return addHighlight(text, params.highlight);
          case "links":
            return addLinks(text);
          case "tg_links":
            return addLinks(text, true);
          case "simple_markdown":
            return replaceSimpleMarkdown(
              text,
              "jsx",
              params?.markdownPostProcessor
            );
          case "simple_markdown_html":
            return replaceSimpleMarkdown(text, "html");
        }
        return text;
      },
      [part]
    )
  );
}
function escapeHtml(textParts) {
  const divEl = document.createElement("div");
  return textParts.reduce((result, part) => {
    if (typeof part !== "string") {
      result.push(part);
      return result;
    }
    divEl.innerText = part;
    result.push(divEl.innerHTML);
    return result;
  }, []);
}
function replaceEmojis(textParts, size, type) {
  if (IS_EMOJI_SUPPORTED) {
    return textParts;
  }
  return textParts.reduce((result, part) => {
    if (typeof part !== "string") {
      result.push(part);
      return result;
    }
    part = fixNonStandardEmoji(part);
    const parts = part.split(EMOJI_REGEX);
    const emojis = part.match(EMOJI_REGEX) || [];
    result.push(parts[0]);
    return emojis.reduce((emojiResult, emoji, i) => {
      const code = nativeToUnifiedExtendedWithCache(emoji);
      if (!code) {
        emojiResult.push(emoji);
      } else {
        /**
         * Original Code: const baseSrcUrl = IS_PACKAGED_ELECTRON ? BASE_URL : '.';
         */
        const baseSrcUrl = "https://web.telegram.org/a";
        const src = `${baseSrcUrl}/img-apple-${
          size === "big" ? "160" : "64"
        }/${code}.png`;
        const className = buildClassName(
          "emoji",
          size === "small" && "emoji-small"
        );
        if (type === "jsx") {
          const isLoaded = LOADED_EMOJIS.has(src);
          emojiResult.push(
            <img
              src={src}
              className={`${className}${
                !isLoaded ? " opacity-transition slow shown" : ""
              }`}
              alt={emoji}
              data-path={src}
              draggable={false}
              onLoad={!isLoaded ? handleEmojiLoad : undefined}
            />
          );
        }
        if (type === "html") {
          emojiResult.push(`<img\
            draggable="false"\
            class="${className}"\
            src="${src}"\
            alt="${emoji}"\
          />`);
        }
      }
      const index = i * 2 + 2;
      if (parts[index]) {
        emojiResult.push(parts[index]);
      }
      return emojiResult;
    }, result);
  }, []);
}
function addLineBreaks(textParts, type) {
  return textParts.reduce((result, part) => {
    if (typeof part !== "string") {
      result.push(part);
      return result;
    }
    const splittenParts = part
      .split(/\r\n|\r|\n/g)
      .reduce((parts, line, i, source) => {
        // This adds non-breaking space if line was indented with spaces, to preserve the indentation
        const trimmedLine = line.trimLeft();
        const indentLength = line.length - trimmedLine.length;
        parts.push(String.fromCharCode(160).repeat(indentLength) + trimmedLine);
        if (i !== source.length - 1) {
          parts.push(type === "jsx" ? <br /> : "<br />");
        }
        return parts;
      }, []);
    return [...result, ...splittenParts];
  }, []);
}
function addHighlight(textParts, highlight) {
  return textParts.reduce((result, part) => {
    if (typeof part !== "string" || !highlight) {
      result.push(part);
      return result;
    }
    const lowerCaseText = part.toLowerCase();
    const queryPosition = lowerCaseText.indexOf(highlight.toLowerCase());
    if (queryPosition < 0) {
      result.push(part);
      return result;
    }
    const newParts = [];
    newParts.push(part.substring(0, queryPosition));
    newParts.push(
      <span className="matching-text-highlight">
        {part.substring(queryPosition, queryPosition + highlight.length)}
      </span>
    );
    newParts.push(part.substring(queryPosition + highlight.length));
    return [...result, ...newParts];
  }, []);
}
const RE_LINK = new RegExp(`${RE_LINK_TEMPLATE}|${RE_MENTION_TEMPLATE}`, "ig");
function addLinks(textParts, allowOnlyTgLinks) {
  return textParts.reduce((result, part) => {
    if (typeof part !== "string") {
      result.push(part);
      return result;
    }
    const links = part.match(RE_LINK);
    if (!links || !links.length) {
      result.push(part);
      return result;
    }
    const content = [];
    let nextLink = links.shift();
    let lastIndex = 0;
    while (nextLink) {
      const index = part.indexOf(nextLink, lastIndex);
      content.push(part.substring(lastIndex, index));
      if (nextLink.startsWith("@")) {
        content.push(<MentionLink username={nextLink}>{nextLink}</MentionLink>);
      } else {
        if (nextLink.endsWith("?")) {
          nextLink = nextLink.slice(0, nextLink.length - 1);
        }
        if (!allowOnlyTgLinks || isDeepLink(nextLink)) {
          content.push(<SafeLink text={nextLink} url={nextLink} />);
        } else {
          content.push(nextLink);
        }
      }
      lastIndex = index + nextLink.length;
      nextLink = links.shift();
    }
    content.push(part.substring(lastIndex));
    return [...result, ...content];
  }, []);
}
function replaceSimpleMarkdown(textParts, type, postProcessor) {
  // Currently supported only for JSX. If needed, add typings to support HTML as well.
  const postProcess = postProcessor || ((part) => part);
  return textParts.reduce((result, part) => {
    if (typeof part !== "string") {
      result.push(part);
      return result;
    }
    const parts = part.split(SIMPLE_MARKDOWN_REGEX);
    const entities = part.match(SIMPLE_MARKDOWN_REGEX) || [];
    result.push(postProcess(parts[0]));
    return entities.reduce((entityResult, entity, i) => {
      if (type === "jsx") {
        entityResult.push(
          entity.startsWith("**") ? (
            <b>{postProcess(entity.replace(/\*\*/g, ""))}</b>
          ) : (
            <i>{postProcess(entity.replace(/__/g, ""))}</i>
          )
        );
      } else {
        entityResult.push(
          entity.startsWith("**")
            ? `<b>${entity.replace(/\*\*/g, "")}</b>`
            : `<i>${entity.replace(/__/g, "")}</i>`
        );
      }
      const index = i * 2 + 2;
      if (parts[index]) {
        entityResult.push(postProcess(parts[index]));
      }
      return entityResult;
    }, result);
  }, []);
}
export function areLinesWrapping(text, element) {
  const lines = (text.trim().match(/\n/g) || "").length + 1;
  const { lineHeight } = getComputedStyle(element);
  const lineHeightParsed = parseFloat(lineHeight.split("px")[0]);
  return element.clientHeight >= (lines + 1) * lineHeightParsed;
}
