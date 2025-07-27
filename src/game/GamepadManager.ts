export interface GamepadState {
    axes: {
        leftX: number;
        leftY: number;
        rightX: number;
        rightY: number;
    };
    buttons: {
        a: boolean;
        b: boolean;
        x: boolean;
        y: boolean;
    };
}

export class GamepadManager {
    private deadzone = 0.15;

    public getGamepadState(playerIndex: number): GamepadState | null {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[playerIndex];

        if (!gamepad) {
            return null;
        }

        return {
            axes: {
                leftX: this.applyDeadzone(gamepad.axes[0] ?? 0),
                leftY: this.applyDeadzone(gamepad.axes[1] ?? 0),
                rightX: this.applyDeadzone(gamepad.axes[2] ?? 0),
                rightY: this.applyDeadzone(gamepad.axes[3] ?? 0),
            },
            buttons: {
                a: gamepad.buttons[0]?.pressed ?? false,
                b: gamepad.buttons[1]?.pressed ?? false,
                x: gamepad.buttons[2]?.pressed ?? false,
                y: gamepad.buttons[3]?.pressed ?? false,
            },
        };
    }

    private applyDeadzone(value: number): number {
        if (Math.abs(value) < this.deadzone) {
            return 0;
        }
        return value;
    }

    public getConnectedCount(): number {
        const gamepads = navigator.getGamepads();
        let count = 0;
        for (const gamepad of gamepads) {
            if (gamepad) count++;
        }
        return count;
    }
}