export class SoundManager {

    private mineHitSound = new Audio('assets/Sounds/player_mine.mp3');

    playMineHit() {
        this.mineHitSound.currentTime = 0;
        this.mineHitSound.play();
    }
}