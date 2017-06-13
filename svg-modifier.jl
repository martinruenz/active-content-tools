#!/usr/bin/julia

# This file is part of https://github.com/martinruenz/active-content-tools
# Copyright (c) 2017 Martin Rünz.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as
# published by the Free Software Foundation, version 3.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

# TODO This file was written quickly and needs a clean-up!

using LightXML

# SVG manipulation
function findByAttr(element::XMLElement, attr, value)
  for e in child_elements(element)
    if attribute(e, attr) == value
      return e
    end
    if has_children(e)
      r = findByAttr(e, attr, value)
      if r != nothing
        return r
      end
    end
  end
end

# function extractTransform(string)
#   strs = split(string, ['(',')',','])
#   # println(strs)
#   strs = strs[strs .!= ""] # remove empty elements
#   # if length(strs) != 3
#   #   return nothing
#   # end
#   # println(strs)
#   return strs
# end

function matchTransformation(transformation, target)
  #match_float = "[+-]?(?:[0-9]*[.])?[0-9]+" # this does not support scientific notation
  match_float = "[+\\-]?(?:0|[1-9]\\d*)(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?"
  match_sep = "\\s*,?\\s*"
  reg = Regex("$transformation\\(($match_float(?:$match_sep$match_float)*)\\)")
  m = match(reg, target)
  if m != nothing
    return [String(ss) for ss in matchall(Regex(match_float), m[1])]
  end
  return nothing
end

function addTransformationToDict(dict, transformation, target)
  m = matchTransformation(transformation, target)
  if m != nothing
    dict[transformation] = m
  end
end
# example:
# input: "translate(100.0  , 1) rotate(10 20,30, 40 , 50 60)"
# output: {translate => ["100.0","1"], rotate => ["10","20","30","40","50","60"]}
function extractTransforms(string)
  r = Dict{String,Array{String,1}}()
  addTransformationToDict(r,"translate",string)
  addTransformationToDict(r,"rotate",string)
  addTransformationToDict(r,"scale",string)
  println(r)
  if matchTransformation("matrix",string) != nothing
    warn("Warning martix interpolation not supported!")
  end
  return r
end

function addNeutralTransformation(dict,transformation,template)
  if transformation == "translate" || transformation == "rotate"
    dict[transformation] = ["0" for t in template]
  elseif transformation == "scale" # verify
    dict[transformation] = ["1" for t in template]
  #elseif transformation == "matrix"
  #
  end
end

function harmoniseTransformation(transform,transforms1,transforms2)
  hk1 = haskey(transforms1,transform)
  hk2 = haskey(transforms2,transform)
  if !hk1 && hk2
    addNeutralTransformation(transforms1,transform,transforms2[transform])
  elseif hk1 && !hk2
    addNeutralTransformation(transforms2,transform,transforms1[transform])
  end
end

function harmoniseTransformations(s1,s2)
  transforms1 = extractTransforms(s1)
  transforms2 = extractTransforms(s2)
  # println("-- in --")
  # println(transforms1)
  # println(transforms2)
  harmoniseTransformation("rotate",transforms1,transforms2)
  harmoniseTransformation("translate",transforms1,transforms2)
  harmoniseTransformation("scale",transforms1,transforms2)
  # println("-- out --")
  # println(transforms1)
  # println(transforms2)
  return (transforms1,transforms2)
end

#refactor or remove TODO
function checkRequiresAnimation(a1,a2)
  if (a1 != nothing) && (a2 != nothing) && (a1 != a2)
    return true
  end
  return false
end

function animateTransform(parent::XMLElement, attr_begin::String, duration::Real, transform, from, to)
  animation_element = new_child(parent, "animateTransform")
  set_attribute(animation_element, "fill", "freeze")
  set_attribute(animation_element, "attributeName", "transform")
  set_attribute(animation_element, "type", transform)
  set_attribute(animation_element, "from", from)
  set_attribute(animation_element, "to", to)
  set_attribute(animation_element, "begin", attr_begin)
  set_attribute(animation_element, "dur", "$(duration)s")
  set_attribute(animation_element, "repeatCount", "0")
end

function animateFromTo(element_from::XMLElement, element_to::XMLElement, attr_begin::String, duration::Real, recursive::Bool)
  # Check transformation
  t1 = attribute(element_from, "transform")
  t2 = attribute(element_to, "transform")
  if ((t1 != nothing) || (t2 != nothing)) && (t1 != t2)
    println("Animating transform...")
    (tdict1,tdict2) = harmoniseTransformations(t1,t2)
    for (k,v) in tdict1
      animateTransform(element_from, attr_begin, duration, k, join(v,','), join(tdict2[k],','))
    end
  end

  # Check paths
  d_1 = attribute(element_from, "d")
  d_2 = attribute(element_to, "d")
  if checkRequiresAnimation(d_1,d_2)
    println("Animating path...")
    animation_element = new_child(element_from, "animate")
    set_attribute(animation_element, "fill", "freeze")
    set_attribute(animation_element, "attributeName", "d")
    set_attribute(animation_element, "attributeType", "XML")
    set_attribute(animation_element, "from", d_1)
    set_attribute(animation_element, "to", d_2)
    set_attribute(animation_element, "begin", attr_begin)
    set_attribute(animation_element, "dur", "$(duration)s")
    set_attribute(animation_element, "repeatCount", "0")
  end

  # Check points
  p_1 = attribute(element_from, "points")
  p_2 = attribute(element_to, "points")
  if checkRequiresAnimation(p_1,p_2)
    println("Animating points...")
    animation_element = new_child(element_from, "animate")
    set_attribute(animation_element, "fill", "freeze")
    set_attribute(animation_element, "attributeName", "points")
    set_attribute(animation_element, "attributeType", "XML")
    set_attribute(animation_element, "from", p_1)
    set_attribute(animation_element, "to", p_2)
    set_attribute(animation_element, "begin", attr_begin)
    set_attribute(animation_element, "dur", "$(duration)s")
    set_attribute(animation_element, "repeatCount", "0")
  end

  if recursive
    for (ef,et) in zip(child_elements(element_from),child_elements(element_to))
       animateFromTo(ef, et, attr_begin, duration, true)
     end
   end
end

function animateFromTo(document::XMLDocument, id_from::String, id_to::String, attr_begin::String, duration::Real, recursive::Bool=false)
  xroot = root(document)
  e_1 = findByAttr(xroot, "id", id_from)
  e_2 = findByAttr(xroot, "id", id_to)

  if e_1 == nothing || e_2 == nothing
    warn("animateFromTo failed, as element $id_from or $id_to wasn't found.")
    return
  end

  animateFromTo(e_1, e_2, attr_begin, duration, recursive)
  unlink(e_2)
end

function animateFromTo(document::XMLDocument, id_from::String, id_to::String, t_begin::Real, duration::Real, recursive::Bool=false)
  animateFromTo(document, id_from, id_to, "$(t_begin)s", duration, recursive)
end

function fade(document::XMLDocument, id::String, attr_begin::String, opacity_start::Real, opacity_end::Real, duration::Real)
  e = findByAttr(root(document), "id", id)
  if e == nothing
    warn("fade failed, as element $id wasn't found.")
    return
  end

  println("Fading element...")
  animation_element = new_child(e, "animate")
  set_attribute(animation_element, "fill", "freeze")
  set_attribute(animation_element, "attributeName", "opacity")
  set_attribute(animation_element, "from", "$opacity_start")
  set_attribute(animation_element, "to", "$opacity_end")
  set_attribute(animation_element, "dur", "$(duration)s")
  set_attribute(animation_element, "begin", attr_begin)
end

function fadeIn(document::XMLDocument, id::String, attr_begin::String, duration::Real)
  e = findByAttr(root(document), "id", id)
  if e == nothing
    warn("fadeIn failed, as element $id wasn't found.")
    return
  end
  set_attribute(e, "opacity", "0")
  fade(document, id, attr_begin, 0, 1, duration)
end

function fadeIn(document::XMLDocument, id::String, t_begin::Real, duration::Real)
  fadeIn(document, id, "$(t_begin)s", duration)
end

function setAttribute(document::XMLDocument, id::String, attribute::String, value::String)
  e = findByAttr(root(document), "id", id)
  if e == nothing
    warn("setAttribute (direct) failed, as element $id wasn't found.")
    return
  end
  set_attribute(e, attribute, value)
end

function setAttribute(document::XMLDocument, id::String, attr_begin::String, duration::Real, attribute::String, value::String)
  e = findByAttr(root(document), "id", id)
  if e == nothing
    warn("setAttribute (at time) failed, as element $id wasn't found.")
    return
  end
  println("Setting element value...")
  animation_element = new_child(e, "set")
  set_attribute(animation_element, "fill", "freeze")
  set_attribute(animation_element, "attributeName", attribute)
  set_attribute(animation_element, "to", value)
  set_attribute(animation_element, "dur", "$(duration)s")
  set_attribute(animation_element, "begin", attr_begin)
  #test set_attribute(animation_element, "repeatCount","indefinite")
end

function setAttribute(document::XMLDocument, id::String, t_begin::Real, duration::Real, attribute::String, value::String)
  setAttribute(document,id,"$(t_begin)s",duration,attribute,value)
end

# function addPause(document::XMLDocument, )
#   <animateTransform begin="myanim.end" id="pause" dur="3s" type="translate" attributeType="XML" attributeName="transform"/>
#
# end

# <set xlink:href="#k1" attributeName="r" begin="1" dur="3" to="40" />
# <set attributeName="visibility" attributeType="CSS" to="visible" begin="3s" dur="6s" fill="freeze" />
# ###########################################################################
#
# Animate dots
# Idea
# <circle cx='0.5000829741363609' cy='0.004488854832865607' r='0.005000473925288565'
#   stroke='black' stroke-width='0.001' stroke-opacity='1' fill='none' visibility='hidden'>
#   <set attributeName='visibility' begin='0.017142857142857144s' from='hidden' to='visible' />
# </circle>


cp("fusion_icon.svg", "fusion_icon_animated.svg"; remove_destination=true)
duration = 1;
chance = 0.6;
lines = [];
f = open("fusion_icon_animated.svg");
is_circle = false;
for l in eachline(f)
  stripped = strip(l);
  splitted = split(l);
  if stripped == "<circle" && (rand() < chance)
    is_circle = true;
  elseif splitted[end] == "/>" && is_circle
    l = join(splitted[1:end-1], " ")
    l = l * " visibility='hidden'>\n<set attributeName='visibility' begin='$(duration * rand())s' from='hidden' to='visible' />\n</circle>\n"
    is_circle = false;
  end
  push!(lines,l)
end
close(f)
open("fusion_icon_animated_out.svg", "w") do f
  for l in lines
    write(f,l)
  end
end
document = parse_file("fusion_icon_animated_out.svg")
fadeIn(document, "gArrows", 0.9,0.3)
fadeIn(document, "gPyr", 0.7,0.3)
fadeIn(document, "gCube", 0.7,0.3)
fadeIn(document, "gBackground", 0.7,0.3)
save_file(document, "fusion_icon_animated_out.svg")

 # ###########################################################################

# File 1
# cp("tracking_icon_animated.svg", "tracking_icon_animated_out.svg"; remove_destination=true)
# animateFromTo("tracking_icon_animated_out.svg","g26176-36","g26176",0.0,1.0)
# animateFromTo("tracking_icon_animated_out.svg","cube_solid1","cube_solid2",0.0,1.0,true)
# fadeIn("tracking_icon_animated_out.svg", "path26199", 0.7,0.35)
# fadeIn("tracking_icon_animated_out.svg", "path26199-8", 0.7,0.35)

# File 2
# file_out = "segmentation_icon_animated_out.svg"
# cp("segmentation_icon_animated.svg", file_out; remove_destination=true)
# document = parse_file(file_out)
# # animateFromTo("segmentation_icon_animated_out.svg","FillGreen-2","FillGreen",0.0,1.0)
# # animateFromTo("segmentation_icon_animated_out.svg","FillBlue-9","FillBlue",0.0,1.0,true)
# # fadeIn("segmentation_icon_animated_out.svg", "BorderBlue", 0.7,0.35)
# # fadeIn("segmentation_icon_animated_out.svg", "BorderGreen", 0.7,0.35)
# save_file(document, file_out)

# File 3
# cp("picp.svg", "picp_animated_out.svg"; remove_destination=true)
# document = parse_file("picp_animated_out.svg")
# fadeIn(document, "gModel2", 0.1,0.5)
# fadeIn(document, "gCamera", 1.5,0.5)
# fadeIn(document, "gImage", 2.2,0.5)
# fadeIn(document, "gObservation", 3,0.5)
# fadeIn(document, "gError", 3.8,0.5)
# save_file(document, "picp_animated_out.svg")

# File 4
# file_out = "photometric_animated_out.svg"
# cp("photometric.svg", file_out; remove_destination=true)
# document = parse_file(file_out)
# fadeIn(document, "gModel2", 0.1,0.5)
# fadeIn(document, "gCamera", 1.5,0.5)
# fadeIn(document, "gImage", 2.2,0.5)
# fadeIn(document, "gObservation3", 3, 0.5)
# save_file(document, file_out)

# File 5
# cp("fusion.svg", "fusion_animated_out.svg"; remove_destination=true)
# document = parse_file("fusion_animated_out.svg")
# setAttribute(document, "imageHighlight", "opacity", "0")
# fadeIn(document, "imgColor", 2,0.5)
# fadeIn(document, "rectHighlight", 4,0.5)
# fadeIn(document, "pathHighlight", 4.8,0.5)
# fadeIn(document, "rectHighlightBig", 4.8,0.5)
# fadeIn(document, "rectHighlightBig", 4.8,0.5)
# setAttribute(document, "imageHighlight", 5, 0.5, "opacity", "1")
# for i in 0:30
#   setAttribute(document, "imageHighlight", 5+i*0.2, 0.2, "xlink:href", "fusion_images/view$(i+75).png")
# end
# save_file(document, "fusion_animated_out.svg")

# animateFromTo("tracking_icon_animated_out.svg","path26048","path26048-7",0,1)
# animateFromTo("tracking_icon_animated_out.svg","path26056","path26056-5",0,1)
# animateFromTo("tracking_icon_animated_out.svg","path26058","path26058-3",0,1)

return 0
