import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useStorageState from "@/hooks/useStorageState";
import {
  HiOutlineListBullet,
  HiOutlinePencil,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
  HiOutlineTrash,
} from "react-icons/hi2";
import { cn, fetchContent, isBotURL, uuid } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import TelegramLogo from "../assets/images/telegram-logo.svg";
import TelegramLinkForm from "./TelegramLinkForm";

/** Load Link Icon */
const loadLinkIcon = function (src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", resolve);
    image.addEventListener("error", reject);
    image.src = src;
  });
};

/** Link Icon */
const FarmerLinkIcon = ({ link, refetch, ...props }) => {
  const [src, setSrc] = useState(null);

  /** Load Link Icon */
  useEffect(() => {
    if (link.icon) {
      loadLinkIcon(link.icon)
        .then(() => {
          setSrc(link.icon);
        })
        .catch(refetch);
    }
  }, [link.icon]);

  return <img {...props} src={src || TelegramLogo} />;
};

export default function FarmerLinks() {
  const {
    settings,
    dispatchAndConfigureSettings,
    dispatchAndOpenTelegramBot,
    dispatchAndOpenTelegramLink,
  } = useAppContext();
  const { value: links, storeValue: storeLinks } = useStorageState("links", []);
  const [openModal, setOpenModal] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);

  /** Show as Grid */
  const showAsGrid = settings.showLinksAsGrid;

  /** Fetch Metadata */
  const telegramLinkMutation = useMutation({
    mutationKey: ["app", "telegram-link"],
    async mutationFn(data) {
      try {
        const html = await fetchContent(data.telegramLink);
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const titleMeta = dom.querySelector('meta[property="og:title"]');
        const imageMeta = dom.querySelector('meta[property="og:image"]');
        const descriptionMeta = dom.querySelector(
          'meta[property="og:description"]'
        );

        return {
          ...data,
          title: data.title || titleMeta.getAttribute("content"),
          icon: imageMeta.getAttribute("content"),
          description: descriptionMeta.getAttribute("content"),
        };
      } catch {}
      return data;
    },
  });

  /** Create or Edit Link */
  const createOrEditLink = useCallback(
    (link = null) => {
      setCurrentLink(link);
      setOpenModal(true);
    },
    [setCurrentLink, setOpenModal]
  );

  /** Store Links */
  const [, dispatchAndStoreLinks] = useSocketDispatchCallback(
    "app.store-links",
    storeLinks,
    [storeLinks]
  );

  /** Delete Link */
  const deleteLink = useCallback(
    (link) => {
      /** Store Links */
      dispatchAndStoreLinks(links.filter((item) => link.id !== item.id));
    },
    [links, dispatchAndStoreLinks]
  );

  /** Update Link */
  const updateLink = useCallback(
    (data) =>
      telegramLinkMutation.mutateAsync(data).then((data) => {
        /** Store Links */
        dispatchAndStoreLinks(
          links.some((link) => link.id === data.id)
            ? links.map((link) => (link.id === data.id ? data : link))
            : [...links, data]
        );
      }),
    [links, dispatchAndStoreLinks]
  );

  /** Save Link */
  const handleFormSubmit = useCallback(
    (data) =>
      toast.promise(
        updateLink({
          ...data,
          id: data.id || uuid(),
        }).then(() => {
          setCurrentLink(null);
          setOpenModal(false);
        }),
        {
          loading: "Please wait...",
          success: "Telegram Link Saved!",
          error: "Failed to Save!",
        }
      ),
    [updateLink]
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "fixed z-50 inset-x-0 bottom-0 flex flex-col bg-white h-3/4 rounded-t-xl",
          "flex flex-col gap-2",
          "px-2 py-4"
        )}
        onOpenAutoFocus={(ev) => ev.preventDefault()}
      >
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle View */}
          <button
            title="Toggle View"
            onClick={() =>
              dispatchAndConfigureSettings(
                "showLinksAsGrid",
                !showAsGrid,
                false
              )
            }
            className={cn(
              "flex items-center justify-center w-10 h-10",
              "rounded-lg shrink-0",
              "text-blue-800 bg-blue-100"
            )}
          >
            {showAsGrid ? (
              <HiOutlineSquares2X2 className="w-4 h-4" />
            ) : (
              <HiOutlineListBullet className="w-4 h-4" />
            )}
          </button>

          {/* Title */}
          <Dialog.Title className="min-w-0 min-h-0 text-lg text-center grow">
            <span
              className={cn(
                "text-transparent font-turret-road font-bold",
                "bg-clip-text",
                "bg-gradient-to-r from-pink-500 to-violet-500"
              )}
            >
              Telegram Links
            </span>
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Farmer Telegram Links
          </Dialog.Description>

          {/* Add Link Button */}
          <button
            title="Add Telegram Link"
            onClick={() => createOrEditLink()}
            className={cn(
              "flex items-center justify-center w-10 h-10",
              "rounded-lg shrink-0",
              "text-blue-800 bg-blue-100"
            )}
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col min-w-0 min-h-0 gap-2 overflow-auto grow overscroll-none">
          {links.length ? (
            <>
              <div
                className={cn(
                  "flex w-full",
                  showAsGrid ? "flex-wrap" : "flex-col gap-2"
                )}
              >
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={cn("flex flex-col", showAsGrid && "w-1/3 p-1")}
                  >
                    <ContextMenu.Root>
                      <ContextMenu.Trigger asChild>
                        <Dialog.Close
                          title={link.title}
                          className={cn(
                            "flex items-center",
                            "gap-2 p-2 rounded-lg",
                            "bg-neutral-100 hover:bg-neutral-200",
                            showAsGrid ? "flex-col justify-center" : "text-left"
                          )}
                          onClick={() =>
                            isBotURL(link.telegramLink)
                              ? dispatchAndOpenTelegramBot(link.telegramLink)
                              : dispatchAndOpenTelegramLink(link.telegramLink)
                          }
                        >
                          {/* Icon */}
                          <FarmerLinkIcon
                            link={link}
                            refetch={() => updateLink(link)}
                            className={cn(
                              "rounded-full shrink-0 bg-neutral-200",
                              showAsGrid ? "w-10 h-10" : "w-8 h-8"
                            )}
                          />

                          <div className="flex flex-col w-full min-w-0 min-h-0 grow">
                            {/* Title */}
                            <h4 className="min-w-0 font-bold truncate">
                              {link.title}
                            </h4>

                            {/* Description */}
                            {link.description ? (
                              <p className="min-w-0 truncate text-neutral-500">
                                {link.description}
                              </p>
                            ) : null}
                          </div>
                        </Dialog.Close>
                      </ContextMenu.Trigger>

                      <ContextMenu.Portal>
                        <ContextMenu.Content
                          collisionPadding={5}
                          alignOffset={5}
                          className={cn(
                            "flex flex-col gap-2 p-2",
                            "text-white rounded-lg bg-neutral-900",
                            "w-[var(--radix-context-menu-content-available-width)]",
                            "max-w-48",
                            "z-50"
                          )}
                        >
                          <ContextMenu.Item
                            onClick={() => createOrEditLink(link)}
                            className={cn(
                              "flex items-center gap-2 p-2",
                              "rounded-lg cursor-pointer",
                              "bg-neutral-800 hover:bg-blue-500"
                            )}
                          >
                            <HiOutlinePencil className="w-4 h-4" /> Edit
                          </ContextMenu.Item>

                          <ContextMenu.Item
                            onClick={() => deleteLink(link)}
                            className={cn(
                              "flex items-center gap-2 p-2",
                              "rounded-lg cursor-pointer",
                              "bg-neutral-800 hover:bg-red-500"
                            )}
                          >
                            <HiOutlineTrash className="w-4 h-4" /> Delete
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="p-2 text-center text-neutral-500">
                You haven't created any link.
              </div>
              <button
                onClick={() => createOrEditLink()}
                className="p-2 text-blue-800 bg-blue-100 rounded-lg"
              >
                Create Link
              </button>
            </>
          )}
        </div>

        {/* Modal */}
        <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-40",
              "flex items-center justify-center",
              "p-4 overflow-auto bg-black/50"
            )}
          >
            <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white rounded-xl">
              {/* Title */}
              <Dialog.Title
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "font-bold text-center"
                )}
              >
                <span
                  className={cn(
                    "text-transparent font-bold",
                    "bg-clip-text",
                    "bg-gradient-to-r from-pink-500 to-violet-500"
                  )}
                >
                  {currentLink ? "Edit Link" : "Create Link"}
                </span>
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description className="sr-only">
                Create or Edit Link
              </Dialog.Description>

              {/* Form */}
              <TelegramLinkForm
                link={currentLink}
                handleFormSubmit={handleFormSubmit}
              />

              {/* Cancel Button */}
              <Dialog.Close
                className={cn("px-4 py-2 bg-neutral-200 rounded-lg")}
              >
                Cancel
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Root>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
