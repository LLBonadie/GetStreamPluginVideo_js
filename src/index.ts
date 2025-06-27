import "./styles.css";
import { StreamVideoClient, User } from "@stream-io/video-client";
import { cleanupParticipant, renderParticipant } from "./participant";
import { renderControls } from "./controls";
import {
  renderAudioDeviceSelector,
  renderAudioOutputSelector,
  renderVideoDeviceSelector,
  renderVolumeControl,
} from "./device-selector";
import { isMobile } from "./mobile";
import { ClosedCaptionManager } from "./closed-captions";

const apiKey = "v5pqa6j3cy94";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGx1Z2luLXRlc3QtMSJ9.eEp_O08j0JyadE6NRJmivPOH7DALr2uOu17O-RFs64U";
const user: User = { id: "plugin-test-1" };

const client = new StreamVideoClient({
  apiKey,
  token,
  user,
  options: { logLevel: "info" },
});

const callId = "FpDUjzLCEg4b";
const call = client.call("default", callId);

call.screenShare.enableScreenShareAudio();
call.screenShare.setSettings({
  maxFramerate: 10,
  maxBitrate: 1500000,
});

const container = document.getElementById("call-controls")!;

// render mic and camera controls
const controls = renderControls(call);
container.appendChild(controls.audioButton);
container.appendChild(controls.videoButton);
container.appendChild(controls.screenShareButton);

container.appendChild(renderAudioDeviceSelector(call));

// render device selectors
if (isMobile.any()) {
  container.appendChild(controls.flipButton);
} else {
  container.appendChild(renderVideoDeviceSelector(call));
}

const audioOutputSelector = renderAudioOutputSelector(call);
if (audioOutputSelector) {
  container.appendChild(audioOutputSelector);
}

container.appendChild(renderVolumeControl(call));

// Closed caption controls
const closedCaptionManager = new ClosedCaptionManager(call);
container.appendChild(closedCaptionManager.renderToggleElement());

const captionContainer = document.getElementById("closed-captions");
captionContainer?.appendChild(closedCaptionManager.renderCaptionContainer());

call.join({ create: true }).then(() => {
  call.camera.enable();
  call.microphone.enable();
});

window.addEventListener("beforeunload", () => {
  call.leave();
});

const parentContainer = document.getElementById("participants")!;
call.setViewport(parentContainer);

call.state.participants$.subscribe((participants) => {
  // render / update existing participants
  participants.forEach((participant) => {
    renderParticipant(call, participant, parentContainer);
  });

  // Remove stale elements for stale participants
  parentContainer
    .querySelectorAll<HTMLMediaElement>("video, audio")
    .forEach((el) => {
      const sessionId = el.dataset.sessionId!;
      const participant = participants.find((p) => p.sessionId === sessionId);
      if (!participant) {
        cleanupParticipant(sessionId);
        el.remove();
      }
    });
});
