import * as React from "react";
import { createPortal } from "react-dom";
import { Toolbar } from "./components/toolbar";
import { Selections } from "./components/selections";
import { ActiveCommentPin } from "./components/active-comment-pin";
import { useEffect, useState } from "react";
import { addClickListener } from "./utils";
import { LiveHighlighter } from "./components/live-highlighter";
import { CONTROL_ELEMENT_CLASS } from "./utils/constants/constants";
import { useUser } from "./hooks/use-user";
import { useStore } from "@nanostores/react";
import { $activeCommentPin, PinDetails } from "./utils/state/activeCommentPin";
import { useMutation, useQuery } from "./lib/wundergraph";
import { $openPreviewConfig } from "./utils/state/openPreviewConfig";
import { cva } from "../styled-system/css";
import "./main.css";

const styles = `__STYLES__`;

function ShadowRoot(props: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLElement>();

  const [root, setRoot] = React.useState<ShadowRoot | null>(null);

  React.useLayoutEffect(() => {
    if (!rootRef.current) {
      rootRef.current = document.createElement("open-previews");
      rootRef.current.classList.add(CONTROL_ELEMENT_CLASS);
      document.body.appendChild(rootRef.current);

      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles.replace("'\\", "\\\\"));
      console.log(styles.replace("'\\", "\\\\"));
      const root = rootRef.current.attachShadow({ mode: "open" });

      root.adoptedStyleSheets = [sheet];

      setRoot(root);
    }
  }, []);

  if (root) {
    return createPortal(props.children, root);
  }

  return null;
}

const pinDetailsTypeGuard = (props: PinDetails | {}): props is PinDetails => {
  // @ts-expect-error
  if (props?.element && props?.coords) {
    return true;
  }
  return false;
};

export interface NewCommentArgs {
  comment: string;
}

export interface NewReplyArgs {
  comment: string;
  replyToId: string;
}

const testRecipe = cva({
  base: {
    bg: "red.100",
    position: "fixed",
    inset: "0",
    zIndex: 1000,
  },
});

function App() {
  const user = useUser();

  const [dimension, setDimension] = useState<number>(
    window.innerHeight + window.innerWidth
  );

  const pinDetails = useStore($activeCommentPin);

  const { commentText, isOpen, ...otherProps } = pinDetails;

  useEffect(() => {
    const unsubscribe = addClickListener();
    return () => {
      unsubscribe();
    };
  }, []);

  const config = useStore($openPreviewConfig);

  const { data, mutate } = useQuery({
    operationName: "Comments",
    input: {
      repository: config.repository,
      categoryId: config.categoryId,
      url: window.location.hostname,
    },
    enabled: !!user.data,
  });

  const { trigger } = useMutation({
    operationName: "CreateComment",
  });

  const createNewThread = ({ comment }: NewCommentArgs) => {
    if (pinDetailsTypeGuard(otherProps)) {
      trigger({
        body: comment ?? "",
        discussionId: data?.id,
        meta: {
          href: window.location.href,
          path: JSON.stringify(otherProps.targetElement?.path ?? "{}"),
          x: otherProps.coords.x,
          y: otherProps.coords.y,
          resolved: false,
          selection: otherProps.selectionRange,
        },
      }).then(() => {
        mutate();
      });
    }
  };

  const createNewReply = ({ comment, replyToId }: NewReplyArgs) => {
    trigger({
      body: comment ?? "",
      discussionId: data?.id,
      replyToId,
    }).then(() => {
      mutate();
    });
  };

  useEffect(() => {
    const rerender = () =>
      setDimension(
        window.innerHeight + window.innerWidth + window.scrollX + window.scrollY
      );

    window.addEventListener("resize", rerender);
    window.addEventListener("scroll", rerender);

    return () => {
      window.removeEventListener("resize", rerender);
      window.removeEventListener("scroll", rerender);
    };
  }, []);

  return (
    <ShadowRoot>
      <div>
        {user.data ? (
          <Selections
            data={data}
            dimension={dimension}
            onReply={createNewReply}
            userDetails={{
              username: user.data.name ?? "",
              profilePicture: user.data.profilePicture ?? "",
            }}
          />
        ) : null}
        <Toolbar />
        {pinDetailsTypeGuard(otherProps) ? (
          <ActiveCommentPin
            pinDetails={otherProps}
            defaultOpen
            dimension={dimension}
            onSubmit={createNewThread}
            onReply={createNewReply}
            userDetails={{
              username: user.data?.name ?? "",
              profilePicture: user.data?.profilePicture ?? "",
            }}
          />
        ) : null}
        {user.data ? <LiveHighlighter /> : null}
      </div>
    </ShadowRoot>
  );
}

export default App;

// import { cva } from '../styled-system/css'
import { styled } from "../styled-system/jsx";

const buttonStyle = cva({
  base: {
    color: "bg.muted",
    textAlign: "center",
  },
  variants: {
    size: {
      small: {
        fontSize: "1rem",
      },
      large: {
        fontSize: "2rem",
      },
    },
  },
});

const Button = styled("button", buttonStyle);
