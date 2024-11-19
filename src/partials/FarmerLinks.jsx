import * as yup from "yup";
import * as Dialog from "@radix-ui/react-dialog";
import useStorageState from "@/hooks/useStorageState";
import { cn, fetchContent, isBotURL } from "@/lib/utils";
import { useCallback } from "react";
import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import Input from "@/components/Input";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import {
  HiOutlinePencil,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import useAppContext from "@/hooks/useAppContext";
import { useEffect } from "react";

import TelegramLogo from "../assets/images/telegram-logo.svg";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

const schema = yup
  .object({
    title: yup.string().trim().label("Title"),
    telegramLink: yup
      .string()
      .trim()
      .url()
      .matches(/^https:\/\/t\.me\/.+/, {
        message: "Not a Valid Telegram Link",
      })
      .required()
      .label("Telegram Link"),
  })
  .required();

export default function FarmerLinks() {
  const { dispatchAndOpenTelegramBot, dispatchAndOpenTelegramLink } =
    useAppContext();
  const { value: links, storeValue: storeLinks } = useStorageState("links", []);
  const [openModal, setOpenModal] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);

  const form = useForm({
    resolver: yupResolver(schema),
  });

  const telegramLinkMutation = useMutation({
    mutationKey: ["app", "telegram-link"],
    async mutationFn(data) {
      try {
        const html = await fetchContent(data.telegramLink);
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const titleMeta = dom.querySelector('meta[property="og:title"]');
        const imageMeta = dom.querySelector('meta[property="og:image"]');

        return {
          ...data,
          title: titleMeta.getAttribute("content"),
          icon: imageMeta.getAttribute("content"),
        };
      } catch {}
      return data;
    },
  });

  const createOrEditLink = useCallback(
    (link = null) => {
      setCurrentLink(link);
      setOpenModal(true);
    },
    [setCurrentLink, setOpenModal]
  );

  const [, dispatchAndStoreLinks] = useSocketDispatchCallback(
    "app.store-links",
    storeLinks,
    [storeLinks]
  );

  /** Delete Link */
  const deleteLink = (link) => {
    /** Store Links */
    dispatchAndStoreLinks(
      links.filter(
        (item) =>
          item.title !== link.title || item.telegramLink !== link.telegramLink
      )
    );
  };

  /** Save Link */
  const handleFormSubmit = (data) => {
    toast.promise(
      telegramLinkMutation.mutateAsync(data).then((data) => {
        /** Store Links */
        dispatchAndStoreLinks(
          currentLink
            ? links.map((link) =>
                link.title === currentLink.title &&
                link.telegramLink === currentLink.telegramLink
                  ? data
                  : link
              )
            : [...links, data]
        );

        setCurrentLink(null);
        setOpenModal(false);
      }),
      {
        loading: "Please wait...",
        success: "Telegram Link Saved!",
        error: "Failed to Save!",
      }
    );
  };

  /** Reset Form */
  useEffect(() => {
    form.reset();
  }, [openModal]);

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
        <div className="flex items-center gap-2">
          <Dialog.Title className="min-w-0 min-h-0 pl-12 text-lg text-center grow">
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

          <button
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
              <div className="flex flex-col gap-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    {/* Link Button */}
                    <Dialog.Close
                      className={cn(
                        "min-w-0 min-h-0 px-2 h-10 grow bg-neutral-100",
                        "text-left rounded-lg",
                        "flex items-center truncate gap-2"
                      )}
                      onClick={() =>
                        isBotURL(link.telegramLink)
                          ? dispatchAndOpenTelegramBot(link.telegramLink)
                          : dispatchAndOpenTelegramLink(link.telegramLink)
                      }
                    >
                      {/* Icon */}
                      <img
                        src={link.icon || TelegramLogo}
                        className="w-8 h-8 rounded-full shrink-0 bg-neutral-200"
                      />

                      {/* Title */}
                      <h4 className="min-w-0 min-h-0 truncate grow">
                        {link.title}
                      </h4>
                    </Dialog.Close>

                    {/* Edit Button */}
                    <button
                      className={cn(
                        "flex items-center justify-center",
                        "w-10 h-10 rounded-lg shrink-0",
                        "bg-neutral-100 hover:bg-blue-500 hover:text-white"
                      )}
                      onClick={() => createOrEditLink(link)}
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      className={cn(
                        "flex items-center justify-center",
                        "w-10 h-10 rounded-lg shrink-0",
                        "bg-neutral-100 hover:bg-red-500 hover:text-white"
                      )}
                      onClick={() => deleteLink(link)}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
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

              <FormProvider {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="flex flex-col gap-2"
                >
                  {/* Title */}
                  <Controller
                    name="title"
                    defaultValue={currentLink?.title || ""}
                    render={({ field, fieldState }) => (
                      <>
                        <label className="text-neutral-500">Title</label>
                        <Input
                          {...field}
                          autoComplete="off"
                          placeholder="Title (Optional)"
                        />
                        {fieldState.error?.message ? (
                          <p className="text-red-500">
                            {fieldState.error?.message}
                          </p>
                        ) : null}
                      </>
                    )}
                  />

                  {/* Telegram Link */}
                  <Controller
                    name="telegramLink"
                    defaultValue={currentLink?.telegramLink || ""}
                    render={({ field, fieldState }) => (
                      <>
                        <label className="text-neutral-500">
                          Telegram Link
                        </label>
                        <Input
                          {...field}
                          autoComplete="off"
                          placeholder="Telegram Link"
                        />
                        {fieldState.error?.message ? (
                          <p className="text-red-500">
                            {fieldState.error?.message}
                          </p>
                        ) : null}
                      </>
                    )}
                  />

                  {/* Save Button */}
                  <button
                    type="submit"
                    className={cn(
                      "px-4 py-2 bg-blue-500 text-white rounded-lg",
                      "disabled:opacity-50"
                    )}
                    disabled={telegramLinkMutation.isPending}
                  >
                    {telegramLinkMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </form>
              </FormProvider>

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
