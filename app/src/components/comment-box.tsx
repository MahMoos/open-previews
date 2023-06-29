import { useStore } from "@nanostores/react";
import React, {
  ChangeEvent,
  FC,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import { NewCommentArgs } from "~/App";
import {
  $activePinCommentText,
  clearActivePinComment,
  removeActiveCommentPin,
  updateActivePinCommentText,
} from "~/utils/state/activeCommentPin";
import { Button } from "./ui/button";
import { Textarea } from "./ui/forms";
import { Avatar } from "./ui/avatar";
import { Box, Flex, Stack } from "../../styled-system/jsx";
import { UserDisplayDetails } from "./comment-thread";

export interface CommentBoxProps extends UserDisplayDetails {
  onSubmit: (data: NewCommentArgs) => unknown;
}

export const CommentBox: FC<CommentBoxProps> = ({
  onSubmit,
  profilePicURL,
  userProfileLink,
  username,
}) => {
  // lazy render the textarea otherwise we loose focus and the selection is lost.
  const [show, setShow] = React.useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 50);
  }, []);

  const commentText = useStore($activePinCommentText);

  const onSend = () => {
    removeActiveCommentPin();
    clearActivePinComment();
    onSubmit({
      comment: commentText,
    });
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateActivePinCommentText(event.target.value);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box bg="bg.subtle" borderBottom="1px solid" borderColor="border.default">
      <Stack
        py="8px"
        px="12px"
        direction="row"
        alignItems="center"
        borderBottom="1px solid"
        borderColor="border.default"
      >
        <Avatar src={profilePicURL} name={username} />
        <a href={userProfileLink} target="_blank" rel="noopener noreferrer">
          {username}
        </a>
      </Stack>
      {show && (
        <Textarea
          autoFocus
          placeholder="Write a comment..."
          value={commentText}
          onChange={handleInputChange}
          onKeyUp={handleKeyUp}
        />
      )}
      <Flex flexDirection="row" justifyContent="flex-end" py="4px" px="12px">
        <Button onClick={onSend}>Send</Button>
      </Flex>
    </Box>
  );
};
