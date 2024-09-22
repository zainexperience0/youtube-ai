import { useEffect, useState } from "react";
import { Bot, Loader } from "lucide-react";
import { AIChat } from "../lib/ai";

function App() {
  const [languages, setLanguages] = useState<any>([]);
  const [subs, setSubs] = useState<any>([]);
  const [activeTab, setActiveTab] = useState<string>("Transcript");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [copyStates, setCopyStates] = useState<boolean[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteStatus, setNoteStatus] = useState<boolean[]>([]);

  const saveNotesToStorage = async (newNotes: string[]) => {
    const response = await chrome.runtime.sendMessage({
      type: "saveNotes",
      notes: newNotes,
    });
    if (response.success) {
      console.log("Saved notes to storage", newNotes);
    }
  };

  const getNotesFromStorage = async () => {
    const response = await chrome.runtime.sendMessage({ type: "getNotes" });
    setNotes(response.notes);
  };

  const getData = async (langCode = "en") => {
    setLoading(true);
    let ct = JSON.parse(
      (await (await fetch(window.location.href)).text())
        .split("ytInitialPlayerResponse = ")[1]
        .split(";var")[0]
    ).captions.playerCaptionsTracklistRenderer;

    const languages = ct.translationLanguages;
    if (languages) {
      setLanguages(
        languages.map((lang: any) => ({
          code: lang.languageCode,
          name: lang.languageName.simpleText,
        }))
      );
    }

    let findCaptionUrl = (x: any) =>
        ct.captionTracks.find((y: any) => y.vssId.indexOf(x) === 0)?.baseUrl,
      firstChoice = findCaptionUrl("." + langCode),
      url = firstChoice
        ? firstChoice + "&fmt=json3"
        : (findCaptionUrl(".") ||
            findCaptionUrl("a." + langCode) ||
            ct.captionTracks[0].baseUrl) +
          "&fmt=json3&tlang=" +
          langCode;

    const fetchedSubs = await (await fetch(url)).json();
    setLoading(false);
    return fetchedSubs.events.map((x: any) => ({
      text: x.segs?.map((x: any) => x.utf8).join(" "),
      time: formatTime(x.tStartMs),
    }));
  };

  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const logSubs = async (langCode: string) => {
    let subs = await getData(langCode);
    setSubs(subs);
    setCopyStates(new Array(subs.length).fill(false));
  };

  useEffect(() => {
    logSubs(selectedLanguage);
    getNotesFromStorage();
  }, [selectedLanguage]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedLanguage(event.target.value);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);

    const updatedCopyStates = [...copyStates];
    updatedCopyStates[index] = true;
    setCopyStates(updatedCopyStates);

    setTimeout(() => {
      updatedCopyStates[index] = false;
      setCopyStates([...updatedCopyStates]);
    }, 2000);
  };

  const generateSummary = (text: string) => {
    setGeneratingSummary(true);
    AIChat(text).then((res) => {
      setSummary(res);
      setGeneratingSummary(false);
    });
  };

  const handleNoteChange = (text: string, time: string, index: number) => {
    const newNote = text + " at " + time;
    const updatedNotes = [...notes, newNote];

    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes); // Save to Chrome storage
    setNoteStatus((prevStatus) => {
      const updatedStatus = [...prevStatus];
      updatedStatus[index] = true;
      return updatedStatus;
    });
  };

  return (
    <div className="h-[90vh] bg-gradient-to-r from-indigo-500 to-purple-600 p-8 flex justify-center items-center">
      <div className="w-full h-full bg-white rounded-lg shadow-xl overflow-y-auto">
        <div className="flex items-center p-6 bg-purple-700 text-white">
          <Bot className="w-10 h-10 mr-4" fill="white" />
          <h1 className="text-4xl font-bold tracking-tight text-center">
            Youtube SuperBot
          </h1>
        </div>

        <div className="flex border-b">
          {["Transcript", "Summary", "Notes"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 p-4 text-xl font-semibold transition-colors duration-300 ${
                activeTab === tab
                  ? "border-b-4 border-purple-700 text-purple-700"
                  : "text-gray-500 hover:text-purple-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "Transcript" && (
            <div>
              <div className="mb-4 flex items-center space-x-4">
                <label htmlFor="language" className="font-semibold text-xl">
                  Select Language:
                </label>
                <select
                  id="language"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="p-2 border rounded-md bg-gray-50 text-lg"
                >
                  {languages.map((lang: any) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex justify-center">
                  <Loader className="animate-spin text-purple-600" />
                </div>
              ) : (
                <ul className="space-y-4">
                  {subs.map((sub: any, index: number) => (
                    <li
                      key={index}
                      className="bg-gray-100 p-4 rounded-lg flex items-center justify-between border border-gray-300"
                    >
                      <span className="font-semibold text-purple-700 mr-4 text-xl">
                        {sub.time}:
                      </span>
                      <p className="flex-1 text-lg text-gray-700">{sub.text}</p>
                      <button
                        className={`p-2 rounded-md text-white ml-4 transition-colors ${
                          copyStates[index]
                            ? "bg-green-500"
                            : "bg-purple-600 hover:bg-purple-500"
                        }`}
                        onClick={() => handleCopy(sub.text, index)}
                      >
                        {copyStates[index] ? "Copied" : "Copy"}
                      </button>
                      <button
                        className={`p-2 rounded-md text-white ml-4 ${
                          noteStatus[index] ? "bg-green-500" : "bg-blue-400"
                        }`}
                        onClick={() =>
                          handleNoteChange(
                            sub.text,
                            new Date().toLocaleDateString(),
                            index
                          )
                        }
                      >
                        {noteStatus[index] ? "Note Taken" : "Take Note"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "Summary" && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold mb-4">Summary</h2>
                <button
                  onClick={() =>
                    generateSummary(subs.map((sub: any) => sub.text).join("\n"))
                  }
                  disabled={generatingSummary}
                  className={`bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors ${
                    generatingSummary ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {generatingSummary ? "Generating..." : "Generate"}
                </button>
              </div>
              {generatingSummary ? (
                <div className="flex justify-center">
                  <Loader className="animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  <p className="text-lg text-gray-700">{summary}</p>
                  {summary && (
                    <button
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded mt-4"
                      onClick={() => handleCopy(summary, -1)} // Dummy index for copying summary
                    >
                      Copy Summary
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "Notes" && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Notes</h2>
              <ul className="space-y-4">
                {notes.map((note, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center text-lg text-gray-700"
                  >
                    <span>{note}</span>
                    <button
                      className={`p-2 rounded-md text-white ml-4 transition-colors ${
                        copyStates[index]
                          ? "bg-green-500"
                          : "bg-purple-600 hover:bg-purple-500"
                      }`}
                      onClick={() => handleCopy(note, index)}
                    >
                      {copyStates[index] ? "Copied" : "Copy"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
