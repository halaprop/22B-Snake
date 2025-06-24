// *** build.sh makes substitutions beginning here *** //
//
// build selects one or the other of these imports
// stripped for snake build
import { SnakeApp } from "./snake.js";

// This file is unaltered in dev. In dev, project is determined by the "project" query param.
// build leaves the params variable untouched.
const params = new URLSearchParams(window.location.search);

// build omits the projectID variable and sets projectKlass to either of the imported classes
const projectKlass = SnakeApp;

// build replaces these ternarys with one or the other value
const namespace = "SNAKE_SUBMISSIONS";
const SUBMISSIONS_WRITE = "DyD/AKdZj3dp5kLG.BKj4KzVkKvpv3+GCmWcrqIT/JtXdw6+oGxw/xZaVbN0ZwcVcdNoWDToL9vIOCV5/CzgDJIP6t8/PaZ8GrQQZXZZJ/jtjofvuYg==";
//
// *** build.sh ends substitutions here *** //

import { readKeys, rleCompress } from "./key-file-reader.js";
import { RemoteStorage } from "./remoteStorage.mjs";

window.addEventListener("DOMContentLoaded", () => {
  document.title = projectID;
  App.el("title-bar-title").innerText = projectID;
  App.el("cout-lines").hidden = projectID == "Snake";
});

const remoteStorage = new RemoteStorage(namespace, SUBMISSIONS_WRITE);

class App {
  static el(id) {
    return document.getElementById(id);
  }
  
  constructor() {
    const fileInput = App.el('key-file-input');
    const submitBtn = App.el('submit-btn');
    const playBtn = App.el('playback-btn');
    const speedBtn = App.el('speed-btn');
    const dropdownEl = App.el('speed-select');

    this.snakeApp = new projectKlass();

    App.el("upload-btn").addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (file) {
        const { keys, text } = await readKeys(file);
        this.keys = keys;
        this.text = text;
        this.snakeApp = new projectKlass();
        this.startPlayback();
        fileInput.value = '';
        playBtn.disabled = false;
        speedBtn.disabled = false;
        submitBtn.disabled = true;
      }
    });

    playBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      if (!this.isPaused) {
        this.continuePlayback();
      }
    });

    this.submitStateReady();

    // menu bar submit
    submitBtn.addEventListener('click', () => {
      UIkit.modal('#submit-modal').show();
      this.submitStateReady();
    });

    // form submission
    const form = App.el('submission-form');
    form.addEventListener('submit', e => this.submitted(e));

    App.el("okay-btn").addEventListener('click', e => {
      UIkit.modal('#submit-modal').hide();
    });

    dropdownEl.querySelectorAll('a[data-sleep]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        e.preventDefault();
        UIkit.dropdown('#speed-select').hide();
        dropdownEl.querySelectorAll('a.uk-active').forEach(el =>
          el.classList.remove('uk-active')
        );
        anchor.classList.add('uk-active');
        App.el('speed-btn').innerHTML = anchor.innerHTML;
      });
    });

    document.addEventListener("keydown", (event) => {
      // Don't handle key events if the submit modal is open
      const activeModal = document.querySelector('.uk-modal.uk-open');
      if (activeModal) return;

      if (!this.gameOver) {
        event.preventDefault();
        event.stopPropagation();
        this.snakeApp.keydown(event.key);
      }
    });

  }

  startPlayback() {
    this.isPaused = false;
    this.playbackIndex = 0;
    this.continuePlayback();
  }

  async continuePlayback() {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (!this.isPaused && this.playbackIndex < this.keys.length) {
      await sleep(this.sleepTimeout);
      const key = this.keys[this.playbackIndex++];
      this.snakeApp.keydown(key);
    }

    if (this.playbackIndex >= this.keys.length) {
      App.el('submit-btn').disabled = false;
    }
  }

  get isPaused() {
    return this._isPaused;
  }

  set isPaused(isPaused) {
    this._isPaused = isPaused;
    const icon = App.el('playback-btn').querySelector("i");
    const faClasses = [...icon.classList].filter(cls => cls.startsWith("fa-"));
    icon.classList.remove(...faClasses);
    icon.classList.add(isPaused ? "fa-play" : "fa-pause");
  }

  get sleepTimeout() {
    const active = App.el('speed-select').querySelector('a.uk-active[data-sleep]');
    return active ? parseInt(active.getAttribute('data-sleep'), 10) : null;
  }

  async submitted(e) {
    e.preventDefault();
    this.submitStateBusy('Saving');

    const firstName = App.el('first-name').value;
    const lastName = App.el('last-name').value;
    const studentID = App.el('student-id').value;

    const keystrokesKey = `keys-${studentID}`;
    const keystrokesValue = rleCompress(text);

    const submissionValue = { firstName, lastName, studentID, keystrokesKey };
    const submissionKey = `submission-${studentID}`;

    try {
      await remoteStorage.setItem(keystrokesKey, keystrokesValue);
      await remoteStorage.setItem(submissionKey, submissionValue);
    } catch (error) {
      this.submitStateDone(error.message);
    } finally {
      this.submitStateDone('Success');
    }    
  }

  submitStateReady() {
    App.el("status-msg").hidden = true;
    App.el("spinner").hidden = true;
    App.el("modal-submit-btn").disabled = false;
    App.el("cancel-btn").hidden = false;
    App.el("cancel-btn").disabled = false;
    App.el("modal-submit-btn").hidden = false;
    App.el("okay-btn").hidden = true;
  }

  submitStateBusy(message) {
    App.el("status-msg").hidden = false;
    App.el("status-msg").innerText = message;

    App.el("spinner").hidden = false;
    App.el("modal-submit-btn").disabled = true;
    App.el("cancel-btn").disabled = true;

  }

  submitStateDone(message) {
    App.el("status-msg").hidden = false;
    App.el("status-msg").innerText = message;

    App.el("spinner").hidden = true;
    App.el("modal-submit-btn").hidden = true;
    App.el("cancel-btn").hidden = true;
    App.el("okay-btn").hidden = false;
  }

}
const app = new App();


