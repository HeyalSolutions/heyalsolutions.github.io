---
title: "Docker Birmingham January 2020: Multi-Architecture Images with buildx"
description: "From my Docker Birmingham meetup talk: how Docker images and manifests handle CPU architectures, and building images for ARM and x86 with docker buildx."
pubDate: 2020-01-08
heroImage: ../../assets/blog/pi.jpg
heroAlt: "A Raspberry Pi single-board computer"
changes: "buildx has since become a standard part of Docker and multi-platform builds no longer need experimental features, so the setup described here is simpler today."
tags: [docker, multi-arch, raspberry-pi, community]
---

Every two months a group of us host a meetup focused on Docker. You can find [the meetup page here](https://www.meetup.com/Docker-Birmingham/).

### Seeing as I have your attention

We are hosting [February's CNCF Birmingham meetup on Wednesday 5th Feb](https://www.meetup.com/Cloud-Native-Birmingham/events/267773567/)
and whilst we haven't finalised the speakers yet, it looks like it will be a good event! Hopefully we will see you there 
too.

## Building Docker images for multiple architectures

<p style="font-size: 0.9rem;font-style: italic;"><img style="display: block;" src="https://farm3.staticflickr.com/2907/14050434430_c8929e270f_b.jpg" alt="Raspberry Pi Compute Module"><a href="https://www.flickr.com/photos/45703688@N07/14050434430">"Raspberry Pi Compute Module"</a><span> by <a href="https://www.flickr.com/photos/45703688@N07">lespounder</a></span> is licensed under <a href="https://creativecommons.org/licenses/by-sa/2.0/?ref=ccsearch&atype=html" style="margin-right: 5px;">CC BY-SA 2.0</a><a href="https://creativecommons.org/licenses/by-sa/2.0/?ref=ccsearch&atype=html" target="_blank" rel="noopener noreferrer" style="display: inline-block;white-space: none;margin-top: 2px;margin-left: 3px;height: 22px !important;"><img style="height: inherit;margin-right: 3px;display: inline-block;" src="https://search.creativecommons.org/static/img/cc_icon.svg" /><img style="height: inherit;margin-right: 3px;display: inline-block;" src="https://search.creativecommons.org/static/img/cc-by_icon.svg" /><img style="height: inherit;margin-right: 3px;display: inline-block;" src="https://search.creativecommons.org/static/img/cc-sa_icon.svg" /></a></p>

This month, Docker Birmingham's own Matt Todd was presenting about building docker images for multiple cpu architectures.

Matt had received a [Jetson Nano by Nvidia](https://developer.nvidia.com/embedded/jetson-nano-developer-kit) over the 
holidays and wanted to get [Elastic's packetbeat](https://www.elastic.co/products/beats/packetbeat)
set up on his home network to understand what data was flowing about. 

When he went to run the docker container on his new kit it wouldn't start, the process kept dying. If you have ever tried
running containers on a Raspberry Pi, for example, you might have found that some containers just don't work, even though 
running the same command on your laptop, desktop or cloud instance works first time. This is most likely due to the 
different CPU instruction sets, and code has to be compiled differently for the different architectures.


## Docker images and CPU Architectures
Let's take the `nginx` container for example. If we [look on Dockerhub](https://hub.docker.com/_/nginx?tab=tags) at the 
latest tag we can see that it is published with multiple different images all pointing at the "latest" tag. 

![nginx latest tag dockerhub, multiple arch/os values](../../assets/blog/nginx-os-arch.png)

This is because the maintainers of nginx have built the image for these different architectures all of these are the same 
version, same source code, but they have produced different images (the digests are different). 

### Docker cleverness 
So why does it "just work" when we type `docker run --rm -p 8080:80 nginx:latest` on a Pi4(arm64) , our laptops(amd64) or
 other computer.

![nginx splash screen](../../assets/blog/nginx-splash.png)

The docker daemon basically does a "best effort" to go off to your registry, finds the image you want and matches it to 
your specific CPU architecture. So in my case it went off and found this image 

![nginx latest for amd64](../../assets/blog/nginx-latest.png)

If you were running the same command on a Pi, you would have got a different image. The one published for the specific 
ARM cpu in your Pi. This image would (well, should) be functionally equivalent to the image pulled by an amd64 computer.

## How can we build these images?

One common way to support multiple architectures when using docker containers is to publish images with different names
depending on which architecture they are targeting, this is a decent approach if you are using a language which you can 
compile, using flags or settings, to create a binary that is specifically tied to one platform. The language I use that 
does this is Go. You give it some flags and can build for a whole host of OS and CPU types.

Matt introduced us to an experimental feature in docker called [buildx](https://docs.docker.com/buildx/working-with-buildx/)
which, through the docker cli, provides full access to the features of [Moby Buildkit](https://github.com/moby/buildkit).

Matt then showed us how, using Docker for Mac, you can enable this experimental feature and use it to create build environments
for a selection of supported architectures. This is provided through the use of an emulator called [QEMU](https://www.qemu.org/).

This emulator provides the environments for buildkit to build these different images, all under the same tag, rather than
the first example where we create different image names or tags. 

### Using buildx

I'm not going to show you how to enable buildx, that's a bit out of scope for this post. We will explore how it can be 
used though.

If we wanted to build this snippet of Go code, which uses the `GOOS` and `GOARCH` values, which are set at compile time,
to print out the cpu arch and OS we used to compile we could use the commands below.

```go
package main

import (
	"fmt"
	"os"
	"runtime"
)

func main() {
	hostname, _ := os.Hostname()
	fmt.Printf("Hello World, I'm %s running on %s/%s\n", hostname, runtime.GOOS, runtime.GOARCH)
}
```


To build this using the buildx feature

```sh 
# assuming contexts node-amd64 and node-arm64 exist in "docker context ls"
$ docker buildx create --use --name mybuild node-amd64
$ docker buildx create --append --name mybuild node-arm64


# We now have the buildx contexts setup, we can build multiple architectures like this!
$ docker buildx build --platform linux/amd64,linux/arm64 -t dockerbirmingham/hello-world:latest .
```


Matt did this live, and pushed the following to Dockerhub

![dockerhub showing multiple images for the same tag](../../assets/blog/dockerhub-multiple-images.png)


If you ran `docker run --rm dockerbirmingham/hello-world:latest` on your arm64 computer, you should see it pulled 
the arm64 image, and amd64 should have pulled on an amd64 computer!


## Wrapping up

That's quite neat. It should allow projects building for multiple architectures to build container images more quickly and
with easier use. It's annoying to have to keep 2 or 3 copies of docker-compose files, or helm charts just because we 
pushed images with different names, or tags, for these differences.

Let's just hope it makes it into stable, and is well supported on linux (docker for Windows & Mac have it packaged in the
VM they use to run docker). Matt said it was a bit harder to use on Linux because docker runs natively rather than in that
VM. 

Matt will be [publishing his slides and dockerfiles etc. here](https://github.com/docker-birmingham/multi-architecture-builds) so you can run 
through them for yourself.

Thanks Matt! 
