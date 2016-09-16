---
layout: post
author: Thomas Gorochowski
people-tags: 
---
# Let’s not forget to measure those complex systems
Being a complexity scientist there is nothing more I like to see than the emergence of beautifully co-ordinated dynamical behaviours in groups of animals. The attached video (Fig. 1) shows this perfectly for the stereotypical example of Starling swarms, technically known as ‘murmurations’. These sorts of phenomena have been studied extensively and one of the most popular theories for how this behaviour arises is the zonal model proposed by Reynolds in the 1980s. This is based on the idea that each individual follows a set of simple rules related to zones of neighbours at differing distances. These include: (i) following the direction of your neighbours; (ii) remaining close to your neighbours; and (iii) avoiding collisions. If you program these into a computer you will see very similar types of behaviour as those in the video (check out [1] for an example that you can run in your browser).

You might ask, "what this has this got to do with engineering?" Well, over recent years the interest in the use of robotic swarms has exploded. This is founded on the hope that like animal swarms, relatively inexpensive robotic agents can be thrown together to perform complex tasks far greater than each could consider alone. By distributing the task amongst the individual robots the system is inherently more resilient to errors and individual breakdowns, and can be scaled more easily to larger tasks. Some interesting examples include the Swarm-bot [3] and Swarmanoid [4] projects (see the videos at the end for an overview).

These types of engineering project require new theories for how robots should behave. Often these rely on previous models developed for biological systems. There is, however, a major issue in assuming that these historical models will be useful - the quantitive validation and evaluation of their accuracy. In the starling example, tracking the locations and movements of all the individuals within the swarm is incredibly difficult. This difficulty is inherent in many complex systems due to the huge number of parts, and has lead to a proliferation of mathematical models that can display all sorts of emergent behaviour. Frustratingly, much less progress has been made in developing new way to validate their quality.

This is slowly beginning to change. One of my favourite examples of this is the work of Lukemana et al [2]. These researchers tracked the movements of birds swarming on a waters surface and extracted individual positions and velocities of each bird. This was easier than the normal 3-dimensional case seen in the video as the birds are effectively moving on a plane in 2-dimensions. Using this data they were are able to assess the accuracy of the zonal model to real-data and uncover actual zonal distances (the size of a birds neighbourhood) for which each rule appeared to be linked. Furthermore, it lead to new speculation that while the rules may be simple, the birds seem able to dynamically vary parameters of each rule based on changes in their environment.

These sorts of study not only help us to explain what we see in the natural world, but are also of great use in enabling us evaluate the ways that natural systems manage these sorts of phenomenon. In addition to harnessing swarms for human activities, many complex man-made systems have been found to display emergent behaviours that in some cases these are unwanted. The closure of the swaying Millennium Bridge in London is a great example of where aspects of the interactions between the many people, environment and structure were overlooked. By validating models to real-world data we are able to piece together how nature tackles similar problems and use these insights to build or control complex systems in new ways.

Funky computer animations of mathematical models are fun and inspiring [1], but without validation their usefulness is limited. Huge advances in experimental techniques are enabling the measurement of new aspects of natural world in unprecedented detail. This makes it the perfect time for complexity scientists to put their money where their mouth is and see just how well their theories stack up - before applying them to new forms of engineered system!

## References
[1] Swarm Intelligence: a web based swarm simulation (requires a HTML 5 compliant browser such as latest versions of Safari, Chrome or Firefox) - http://lab.cmikavac.net/swarm/, [accessed March 2013]

[2] Ryan Lukemana *et al.* (2010) Inferring individual rules from collective behaviour. *PNAS*, 107 - http://www.pnas.org/content/107/28/12576.short, [accessed March 2013]

[3] Swarm-bot project website - http://www.swarm-bots.org, [accessed March 2013]

[4] Swarmanoid project website - http://www.swarmanoid.org, [accessed March 2013]

## Embedded Images and Videos
**Figure 1: (display at start of article)** An amazing encounter with a swarm of starling, technically known as a murmuration. (Video credit: Islands & Rivers, http://vimeo.com/31158841)
*Source:* The following HTML will embed the required video the width and height should be able to be changed in the HTML.
<iframe src="http://player.vimeo.com/video/31158841" width="500" height="400" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>

**Figure 2: (display at end of article)** Conceptual video showing how a swarm of robots can work together to pull a child to safety. (Video credit: Swarm-bots project, http://www.youtube.com/watch?v=CJOubyiITsE)
*Source:* The following HTML will embed the required video the width and height should be able to be changed in the HTML.
<iframe width="420" height="315" src="http://www.youtube.com/embed/CJOubyiITsE" frameborder="0" allowfullscreen></iframe>

**Figure 3: (display at end of article)** How swarms of different types of robots can work together to explore their environment. (Video credit: Swarmanoid project, http://www.youtube.com/watch?v=M2nn1X9Xlps)
*Source:* The following HTML will embed the required video the width and height should be able to be changed in the HTML.
<iframe width="560" height="315" src="http://www.youtube.com/embed/M2nn1X9Xlps" frameborder="0" allowfullscreen></iframe>
