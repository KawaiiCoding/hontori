/*
 * Environment.js
 * Job: the state of the air: the animation time, the hour of the day, the weather and the wind.
 * This object is what every painter receives as `env`.
 *
 * Public API:
 *   t          seconds of animation time; always runs while the world is visible
 *   time       hour of the day, 0..24; one game hour passes every 2 real minutes
 *   weather    one of WEATHERS
 *   wind       0..1, drifts toward what the weather asks for
 *   indoor     true inside buildings
 *   advance(dt, clockRuns)   one step; the hour only moves when clockRuns is true
 *   setTime(hour), setWeather(weather)
 *   WEATHERS   the weathers the painters know
 */

export const WEATHERS = ['clear', 'rain', 'wind', 'snow', 'fog'];

const SECONDS_PER_GAME_HOUR = 120;
const WIND_OF = { wind: 0.45, rain: 0.3 };
const CALM_WIND = 0.1;

export class Environment {
  t = 0;
  time = 12;
  weather = 'clear';
  wind = CALM_WIND;
  indoor = false;

  advance(dt, clockRuns) {
    this.t += dt;
    if (clockRuns) this.time = (this.time + dt / SECONDS_PER_GAME_HOUR) % 24;
    const target = (WIND_OF[this.weather] || CALM_WIND) + Math.sin(this.t * 0.4) * 0.1;
    this.wind += (target - this.wind) * dt * 0.8;
  }

  setTime(hour) {
    this.time = ((hour % 24) + 24) % 24;
  }

  setWeather(weather) {
    if (WEATHERS.includes(weather)) this.weather = weather;
  }
}
