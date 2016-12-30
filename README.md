# AAC Shim

AAC Shim is a simple helper method for helping web apps that want to support being
embedded inside an AAC system.

## What is AAC?
AAC stands for Augmentative and Alternative Communication. It's a broad term that includes
anything that supplements or replaces verbal communication, but many people use it 
to specifically refer to speech-generating tools that run on a computer or tablet. If
someone can't speak or struggles to speak on their own, whether because of a disability,
surgery or temporary issue, they can tap out messages and hit a button to have a device
speak for them. It's actually super cool.

If the individual is literate and has good control of their hands they could just
type out their messages with a keyboard. But for a lot of communicators that's asking
too much, so they can instead use buttons with pictures or common phrases to make
things easier or faster. Again, super cool.

You probably envisioned someone tapping away on a tablet during that description of
AAC, but that's actually only one method of access. Some users can't move their hands 
that well or at all, but they can still blink, or swallow, or move their eyes, or trigger
a single muscle, or even just initiate some brain activity. Any of those actions can 
be picked up by a range of different devices and interpreted as a selection by the
user. If you aren't freaking out right now about how amazing technology is then you should
probably give yourself a minute to do so.

But if you're a web developer, you're also thinking about how insanely painful it would
be to have to support all of those different selection techniques. The good (scary?) news is 
that someone is probably actually already using alternative access tools to navigate your
site. A lot of the hardware actually comes with mouse emulators and such so you don't have to do
a whole lot other than, you know, support accessibility standards.

## Why AAC-Enable my Page?
Some users have high enough functionality that they can navigate between web sites,
load apps, minimize windows, etc. But for some users, their primary access method is
their AAC interface. If they want to, say, control their smart home, or play an educational
game, or read a book, or Skype with their friends, they do it all from within their
AAC interface. Traditionally all that functionality had to be hard-coded into the 
AAC app itself, but if you've ever tracked the moving target of a modern web API then
you know how sucky that prospect sounds.

So! Instead we're pushing a new strategy, where web apps can build in their own support
for AAC users and (along with some offline caching) more extensibly offer support for
individuals who use their AAC system as the primary channel to the online world.

Honestly most of the first-generation of AAC-enabled web apps will probably be written
as shims of their own, simplified interfaces to more complicated systems like SmartThings,
Facebook, YouTube, GoodReads, Fandango, etc. But that's ok, we still want to make those 
easier to build so we can help people out!

## How to Use AAC Shim
Include the shim in your page, then

```
aac_shim.status(function(result) {
  if(result.status == 'ready') {
    aac_shim.map_to_mouse_events();
  }
});
```

^ That's the easiest level of integration. It will take any "hover" events, whether they're 
done by a mouse or eye tracker or head mouse or whatever, and trigger them as standard
`mousemove` events. It'll also map any taps, touches, clicks, or other selections to
standard `click` events for you.

Different AAC systems may work differently, so make sure to wait for a status response of
`ready` before making any other calls to AAC Shim.

### Defining Targets
Targets are regions on the screen that you want to make accessible to the user. The user
can always hover or click anywhere in your frame and you can receive the event, but you
can also define specific regional targets. Here's why you would do that:

Having the whole frame as a large region for selection is nice and flexible, but it can
make it harder for the user to know what they're supposed to do. Some users only have
enough control to essentially hit a single button, so the AAC interface may "scan" through
all the available targets, drawing a highlighted box around each target, one at a time.
Or if the user is driving the mouse cursor via eye gaze or head movements, often selection
occurs by "holding still" or "dwelling" on the same spot for a period of time. Defining 
targets helps the system know the user is dwelling on a target even if there's some
movement.

Anyway, here's how to define targets:

```
aac_shim.add_target({
  id: 'my_target' // if you don't define one, the shim will for you
  left: 50, // pixels
  top: 50, // or you set as a percent "10%"
  width: 150,
  height: 150,
  prompt: "bacon", // this is an auditory prompt given to users with vision or processing issues
  
}, function(result) {
  // called whenever the target is selected
});
```

You can also `clear_target` to clear one at a time, by id, or `clear_targets` to clear them
all at once.

## License

Licensed under the MIT License.