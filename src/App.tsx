/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, GameSettings, Soal, SoalHistoryItem, TeamScore } from './types';
import { selectQuestions, markSoalAsSeen } from './data/bankSoal';
import { Navbar } from './components/Navbar';
import { MainMenu } from './components/MainMenu';
import { Game1KiriKanan } from './components/Game1KiriKanan';
import { Game2TangkapKata } from './components/Game2TangkapKata';
import { GameSummary } from './components/GameSummary';
import { InstructionsModal } from './components/InstructionsModal';
import { CameraTestModal } from './components/CameraTestModal';
import { EditSoalModal } from './components/EditSoalModal';

type AppScreen = 'menu' | 'game1' | 'game2' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [isCamTestOpen, setIsCamTestOpen] = useState<boolean>(false);
  const [isEditSoalOpen, setIsEditSoalOpen] = useState<boolean>(false);
  const [soalVersion, setSoalVersion] = useState<number>(0);

  // Status Permainan Aktif
  const [activeQuestions, setActiveQuestions] = useState<Soal[]>([]);
  const [activeSettings, setActiveSettings] = useState<GameSettings | null>(null);
  const [activeGameMode, setActiveGameMode] = useState<GameMode>('kiri-kanan');

  // Hasil Permainan
  const [gameHistory, setGameHistory] = useState<SoalHistoryItem[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalTeamScores, setFinalTeamScores] = useState<TeamScore[] | undefined>(undefined);

  const handleStartGame = (mode: GameMode, settings: GameSettings) => {
    setActiveGameMode(mode);
    setActiveSettings(settings);

    // Ambil soal yang disaring dan diacak
    const selection = selectQuestions(
      settings.jumlahSoal,
      settings.selectedTopik,
      settings.levelFilter,
      settings.avoidSeenQuestions
    );

    setActiveQuestions(selection.questions);
    setScreen(mode === 'kiri-kanan' ? 'game1' : 'game2');
  };

  const handleFinishGame = (
    history: SoalHistoryItem[],
    totalScore: number,
    teamScores?: TeamScore[]
  ) => {
    setGameHistory(history);
    setFinalScore(totalScore);
    setFinalTeamScores(teamScores);

    // Tandai soal yang telah dilihat agar tidak berulang di sesi selanjutnya
    const ids = history.map((h) => h.soal.id);
    markSoalAsSeen(ids);

    setScreen('summary');
  };

  const handlePlayAgain = () => {
    if (activeSettings) {
      handleStartGame(activeGameMode, activeSettings);
    } else {
      setScreen('menu');
    }
  };

  const handleReturnMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        title="KKA MULTIMEDIA ARENA"
        isMirrored={isMirrored}
        onToggleMirror={() => setIsMirrored((prev) => !prev)}
        onOpenInstructions={() => setIsInstructionsOpen(true)}
        onOpenCamTest={() => setIsCamTestOpen(true)}
        onReturnHome={screen !== 'menu' ? handleReturnMenu : undefined}
      />

      {/* Screen Routing */}
      <main className="flex-1 flex flex-col">
        {screen === 'menu' && (
          <MainMenu
            key={soalVersion}
            onStartGame={handleStartGame}
            onOpenCamTest={() => setIsCamTestOpen(true)}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
            isMirrored={isMirrored}
            onToggleMirror={() => setIsMirrored((prev) => !prev)}
            onOpenEditSoal={() => setIsEditSoalOpen(true)}
          />
        )}

        {screen === 'game1' && activeSettings && (
          <Game1KiriKanan
            questions={activeQuestions}
            settings={activeSettings}
            isMirrored={isMirrored}
            onFinishGame={handleFinishGame}
            onReturnMenu={handleReturnMenu}
          />
        )}

        {screen === 'game2' && activeSettings && (
          <Game2TangkapKata
            questions={activeQuestions}
            settings={activeSettings}
            isMirrored={isMirrored}
            onFinishGame={handleFinishGame}
            onReturnMenu={handleReturnMenu}
          />
        )}

        {screen === 'summary' && (
          <GameSummary
            gameTitle={activeGameMode === 'kiri-kanan' ? 'Kiri atau Kanan' : 'Tangkap Kata'}
            totalScore={finalScore}
            totalQuestions={activeQuestions.length}
            totalCorrect={gameHistory.filter((h) => h.isCorrect).length}
            teamScores={finalTeamScores}
            history={gameHistory}
            onPlayAgain={handlePlayAgain}
            onReturnMenu={handleReturnMenu}
          />
        )}
      </main>

      {/* Modal Petunjuk & Privasi */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      {/* Modal Uji Kamera & Model AI */}
      <CameraTestModal
        isOpen={isCamTestOpen}
        onClose={() => setIsCamTestOpen(false)}
        isMirrored={isMirrored}
        onToggleMirror={() => setIsMirrored((prev) => !prev)}
      />

      {/* Modal Kelola & Edit Bank Soal */}
      <EditSoalModal
        isOpen={isEditSoalOpen}
        onClose={() => setIsEditSoalOpen(false)}
        onQuestionsUpdated={() => setSoalVersion((v) => v + 1)}
      />
    </div>
  );
}
