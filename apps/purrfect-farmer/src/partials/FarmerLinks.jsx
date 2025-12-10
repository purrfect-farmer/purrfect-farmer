import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useStorageState from "@/hooks/useStorageState";
import { ContextMenu } from "radix-ui";
import { Dialog } from "radix-ui";
import {
  HiOutlineArrowUpRight,
  HiOutlineGlobeAlt,
  HiOutlineListBullet,
  HiOutlinePencil,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
  HiOutlineTrash,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import { cn, fetchContent, isBotURL, uuid } from "@/lib/utils";
import { memo, useCallback } from "react";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import TelegramLinkForm from "./TelegramLinkForm";
import TelegramLogo from "../assets/images/telegram-logo.svg";
import useLocationToggle from "@/hooks/useLocationToggle";
import PrimaryButton from "@/components/PrimaryButton";
import BottomDialog from "@/components/BottomDialog";
import Container from "@/components/Container";

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
const FarmerLinkIcon = memo(({ link, refetch, ...props }) => {
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
});

const LinkContextItem = (props) => (
  <ContextMenu.Item
    {...props}
    className={cn(
      "flex items-center gap-2 p-2",
      "rounded-lg cursor-pointer",
      "bg-neutral-800 hover:bg-blue-500",
      props.className
    )}
  />
);

const LinkHeaderButton = (props) => (
  <button
    {...props}
    className={cn(
      "flex items-center justify-center w-10 h-10",
      "rounded-lg shrink-0",
      "bg-blue-100 text-blue-800",
      "dark:bg-neutral-700 dark:text-blue-200",
      props.className
    )}
  />
);

export default memo(function FarmerLinks() {
  const {
    settings,
    dispatchAndConfigureSettings,
    dispatchAndOpenTelegramBot,
    dispatchAndOpenTelegramLink,
    dispatchAndJoinTelegramLink,
  } = useAppContext();
  const { value: links, storeValue: storeLinks } = useStorageState("links", []);
  const [openModal, setOpenModal] = useLocationToggle(
    "app.toggle-link-modal",
    false
  );
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
      } catch (e) {
        console.error(e);
      }
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
  const [, dispatchAndStoreLinks] = useMirroredCallback(
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
    <BottomDialog.Container
      onOpenAutoFocus={(ev) => ev.preventDefault()}
      className={cn("h-3/4 gap-2", "px-2 py-4")}
    >
      <div className="shrink-0">
        <Container className="flex items-center gap-2 p-0">
          {/* Toggle View */}
          <LinkHeaderButton
            title="Toggle View"
            onClick={() =>
              dispatchAndConfigureSettings(
                "showLinksAsGrid",
                !showAsGrid,
                false
              )
            }
          >
            {showAsGrid ? (
              <HiOutlineSquares2X2 className="w-4 h-4" />
            ) : (
              <HiOutlineListBullet className="w-4 h-4" />
            )}
          </LinkHeaderButton>

          {/* Title */}
          <Dialog.Title
            className={cn(
              "grow min-w-0",
              "text-xl font-bold font-turret-road text-orange-500 text-center"
            )}
          >
            Telegram Links
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Farmer Telegram Links
          </Dialog.Description>

          {/* Add Link Button */}
          <LinkHeaderButton
            title="Add Telegram Link"
            onClick={() => createOrEditLink()}
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
          </LinkHeaderButton>
        </Container>
      </div>

      <div className="min-w-0 min-h-0 overflow-auto grow overscroll-none">
        <Container className="flex flex-col gap-2 p-0">
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
                            "bg-neutral-100 dark:bg-neutral-700",
                            "hover:bg-neutral-200 dark:hover:bg-neutral-600",
                            showAsGrid ? "flex-col justify-center" : "text-left"
                          )}
                          onClick={() =>
                            isBotURL(link.telegramLink)
                              ? dispatchAndOpenTelegramBot(link.telegramLink, {
                                  browserId: `farmer-link-${link.id}`,
                                  browserTitle: link.title,
                                  browserIcon: link.icon,
                                })
                              : dispatchAndOpenTelegramLink(link.telegramLink)
                          }
                        >
                          {/* Icon */}
                          <FarmerLinkIcon
                            link={link}
                            refetch={() => updateLink(link)}
                            className={cn(
                              "rounded-full shrink-0 bg-neutral-200 dark:bg-neutral-600",
                              showAsGrid ? "w-10 h-10" : "w-8 h-8"
                            )}
                          />

                          <div className="flex flex-col w-full min-w-0 min-h-0 grow">
                            {/* Title */}
                            <h4 className="w-full min-w-0 font-bold truncate">
                              {link.title}
                            </h4>

                            {/* Description */}
                            {link.description ? (
                              <p className="w-full min-w-0 truncate text-neutral-400">
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
                            "max-w-[--(--radix-context-menu-content-available-width)]",
                            "w-48",
                            "z-50"
                          )}
                        >
                          {/* Open Link */}
                          <LinkContextItem
                            onClick={() =>
                              dispatchAndOpenTelegramLink(link.telegramLink)
                            }
                          >
                            <HiOutlineArrowUpRight className="w-4 h-4" /> Open
                            Link
                          </LinkContextItem>

                          {/* Launch Bot */}
                          <LinkContextItem
                            onClick={() =>
                              dispatchAndOpenTelegramBot(link.telegramLink, {
                                browserId: `farmer-link-${link.id}`,
                                browserTitle: link.title,
                                browserIcon: link.icon,
                              })
                            }
                          >
                            <HiOutlineGlobeAlt className="w-4 h-4" /> Launch Bot
                          </LinkContextItem>

                          {/* Join */}
                          <LinkContextItem
                            onClick={() =>
                              dispatchAndJoinTelegramLink(link.telegramLink)
                            }
                          >
                            <HiOutlineUserPlus className="w-4 h-4" /> Join Link
                          </LinkContextItem>

                          {/* Edit */}
                          <LinkContextItem
                            onClick={() => createOrEditLink(link)}
                          >
                            <HiOutlinePencil className="w-4 h-4" /> Edit
                          </LinkContextItem>

                          {/* Delete */}
                          <LinkContextItem
                            onClick={() => deleteLink(link)}
                            className={cn("bg-neutral-800 hover:bg-red-500")}
                          >
                            <HiOutlineTrash className="w-4 h-4" /> Delete
                          </LinkContextItem>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="p-2 text-center text-neutral-400">
                You haven't created any link.
              </div>
              <PrimaryButton onClick={() => createOrEditLink()}>
                Create Link
              </PrimaryButton>
            </>
          )}
        </Container>
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
          <Dialog.Content
            className={cn(
              "bg-white dark:bg-neutral-800",
              "flex flex-col w-full max-w-sm gap-2 p-4 rounded-xl"
            )}
          >
            {/* Title */}
            <Dialog.Title
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "text-purple-500 dark:text-purple-400",
                "font-bold text-center text-sm"
              )}
            >
              {currentLink ? "Edit Link" : "Create Link"}
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
              className={cn(
                "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg"
              )}
            >
              Cancel
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Root>
    </BottomDialog.Container>
  );
});
